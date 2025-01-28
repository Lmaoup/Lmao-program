import React, { useState } from "react";

// ============ EXERCISE PROFILES ============
const EXERCISE_PROFILES = {
  BenchPress: {
    name: "Bench Press",
    accessories: [
      { name: "Close-Grip Bench Press", details: "3x8 @ ~65%" },
      { name: "Incline Dumbbell Press", details: "3x10-12" },
      { name: "Triceps Extensions", details: "3x15" },
      { name: "Face Pulls", details: "3x15" },
    ],
  },
  Squat: {
    name: "Squat",
    accessories: [
      { name: "Lunges", details: "3x8 per leg" },
      { name: "Leg Press", details: "4x10-12" },
      { name: "Hamstring Curls", details: "3x12" },
      { name: "Calf Raises", details: "3x15" },
    ],
  },
  Deadlift: {
    name: "Deadlift",
    accessories: [
      { name: "Romanian Deadlift", details: "3x8" },
      { name: "Pull-Ups", details: "3 sets to failure" },
      { name: "Bent-Over Rows", details: "3x10" },
      { name: "Planks", details: "3x30 sec" },
    ],
  },
  OverheadPress: {
    name: "Overhead Press",
    accessories: [
      { name: "Seated Dumbbell Press", details: "3x10" },
      { name: "Lateral Raises", details: "3x12" },
      { name: "Triceps Pushdowns", details: "3x15" },
      { name: "Face Pulls", details: "3x15" },
    ],
  },
};

// ============ DETERMINE PROGRAM LENGTH ============
function getRecommendedWeeks(currentPR, targetPR) {
  const diff = targetPR - currentPR;
  if (diff <= 0) return 6;
  if (diff < 5) return 6;
  if (diff < 10) return 8;
  if (diff < 20) return 10;
  return 12;
}

// ============ DAY TEMPLATES ============
const DAY_TYPES = [
  {
    label: "Heavy",
    startPct: 0.70,
    endPct: 0.95,
    baseSets: 4,
    baseReps: 4,
  },
  {
    label: "Volume",
    startPct: 0.65,
    endPct: 0.85,
    baseSets: 5,
    baseReps: 5,
  },
  {
    label: "Moderate",
    startPct: 0.75,
    endPct: 0.90,
    baseSets: 4,
    baseReps: 5,
  },
  {
    label: "Power",
    startPct: 0.80,
    endPct: 0.95,
    baseSets: 3,
    baseReps: 3,
  },
  {
    label: "Volume",
    startPct: 0.65,
    endPct: 0.85,
    baseSets: 4,
    baseReps: 6,
  },
  {
    label: "Moderate",
    startPct: 0.70,
    endPct: 0.90,
    baseSets: 4,
    baseReps: 4,
  },
  {
    label: "Heavy",
    startPct: 0.70,
    endPct: 0.95,
    baseSets: 3,
    baseReps: 3,
  },
];

// A special template for the last week's Day 1: Taper
const TAPER_TEMPLATE = {
  label: "Taper",
  startPct: 0.50,
  endPct: 0.65,
  baseSets: 2,
  baseReps: 3,
};

// ============ GENERATE PROGRAM ============
function generateProgram(currentPR, targetPR, frequency) {
  const totalWeeks = getRecommendedWeeks(currentPR, targetPR);
  const plan = [];

  for (let w = 0; w < totalWeeks; w++) {
    const weekNumber = w + 1;
    const isLastWeek = w === totalWeeks - 1;
    // fraction from 0..1 across totalWeeks
    const fraction = w / (totalWeeks - 1 || 1);
    const days = [];

    for (let d = 0; d < frequency; d++) {
      const isLastDay = d === frequency - 1;

      // Final week, final day => PR attempt
      if (isLastWeek && isLastDay) {
        days.push({
          dayNumber: d + 1,
          label: "PR Attempt",
          isPRDay: true,
          warmupSets: createWarmUpSets(targetPR),
          finalAttemptWeight: targetPR,
        });
      }
      // Final week, Day 1 => Taper (if frequency>1)
      else if (isLastWeek && d === 0 && frequency > 1) {
        const dayPct = interpolatePct(
          TAPER_TEMPLATE.startPct,
          TAPER_TEMPLATE.endPct,
          fraction
        );
        days.push({
          dayNumber: d + 1,
          label: "Taper",
          isPRDay: false,
          sets: TAPER_TEMPLATE.baseSets,
          reps: TAPER_TEMPLATE.baseReps,
          percentage: dayPct,
          weight: roundToOneDecimal(currentPR * dayPct),
        });
      }
      // Normal day
      else {
        const dayType = DAY_TYPES[d];
        if (!dayType) break;

        const { label, startPct, endPct, baseSets, baseReps } = dayType;
        const dayPct = interpolatePct(startPct, endPct, fraction);

        // Example volume fade
        let sets = baseSets;
        let reps = baseReps;
        if (fraction > 0.6) {
          sets = Math.max(1, baseSets - 1);
          reps = Math.max(1, baseReps - 1);
        }

        days.push({
          dayNumber: d + 1,
          label,
          isPRDay: false,
          sets,
          reps,
          percentage: dayPct,
          weight: roundToOneDecimal(currentPR * dayPct),
        });
      }
    }
    plan.push({ week: weekNumber, days });
  }

  return plan;
}

// ============ WARM-UP SETS FOR PR DAY ============
function createWarmUpSets(targetPR) {
  const warmupPercentages = [
    { pct: 0.5, reps: 5 },
    { pct: 0.6, reps: 3 },
    { pct: 0.7, reps: 2 },
    { pct: 0.8, reps: 1 },
  ];
  return warmupPercentages.map((wu) => ({
    weight: roundToOneDecimal(targetPR * wu.pct),
    reps: wu.reps,
    percentage: wu.pct,
  }));
}

// ============ HELPERS ============
function interpolatePct(start, end, fraction) {
  return start + (end - start) * fraction;
}

function roundToOneDecimal(num) {
  return Math.round(num * 10) / 10;
}

// ============ MAIN APP COMPONENT ============
export default function App() {
  const [selectedExercise, setSelectedExercise] = useState("BenchPress");
  const [currentPR, setCurrentPR] = useState(90);
  const [targetPR, setTargetPR] = useState(100);
  const [frequency, setFrequency] = useState(2);
  const [units, setUnits] = useState("kg");

  const [program, setProgram] = useState([]);
  const [accessories, setAccessories] = useState([]);

  const unitLabel = units === "kg" ? "kg" : "lbs";

  function handleGenerate() {
    // Calculate diff
    const diff = targetPR - currentPR;
    if (diff <= 0) {
      alert("Target PR must be higher than current PR.");
      return;
    }
    
    // If diff >= 50 => show prompt
    if (diff >= 50) {
      alert(
        "This program is not designed for such a large PR jump. " +
        "Adding 50kg or more is unrealistic in one cycle. " +
        "Please try a more attainable goal."
      );
      return;
    }

    const profile = EXERCISE_PROFILES[selectedExercise];
    if (!profile) {
      alert("Invalid exercise choice.");
      return;
    }

    const newPlan = generateProgram(currentPR, targetPR, frequency);
    setProgram(newPlan);
    setAccessories(profile.accessories);
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center">
      <div className="w-full max-w-4xl p-6 bg-white rounded-2xl shadow space-y-6">
        <h1 className="text-center text-2xl font-bold">
          Variable-Length Program (Taper + PR Attempt)
        </h1>
        <p className="text-center text-sm text-gray-600">
          Last week's Day 1 is a lighter taper day; final day is your PR attempt!
        </p>

        {/* ===== User Inputs ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Exercise */}
          <div>
            <label className="block mb-1 font-medium">Exercise</label>
            <select
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="BenchPress">Bench Press</option>
              <option value="Squat">Squat</option>
              <option value="Deadlift">Deadlift</option>
              <option value="OverheadPress">Overhead Press</option>
            </select>
          </div>

          {/* Current PR */}
          <div>
            <label className="block mb-1 font-medium">
              Current 1RM ({unitLabel})
            </label>
            <input
              type="number"
              value={currentPR}
              onChange={(e) => setCurrentPR(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>

          {/* Target PR */}
          <div>
            <label className="block mb-1 font-medium">
              Target 1RM ({unitLabel})
            </label>
            <input
              type="number"
              value={targetPR}
              onChange={(e) => setTargetPR(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="block mb-1 font-medium">Weekly Frequency</label>
            <input
              type="range"
              min={1}
              max={7}
              value={frequency}
              onChange={(e) => setFrequency(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-sm text-center mt-2">
              {frequency} session(s)/week
            </div>
          </div>

          {/* Units */}
          <div>
            <label className="block mb-1 font-medium">Units</label>
            <select
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="kg">Kilograms (kg)</option>
              <option value="lbs">Pounds (lbs)</option>
            </select>
          </div>
        </div>

        {/* ===== Generate Button ===== */}
        <button
          onClick={handleGenerate}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
        >
          Generate Program
        </button>

        {/* ===== Display Program ===== */}
        {program.length > 0 && (
          <div className="border-t pt-4">
            <h2 className="text-xl font-semibold mb-2">
              {EXERCISE_PROFILES[selectedExercise].name} Program
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Going from {currentPR}
              {unitLabel} → {targetPR}
              {unitLabel}.<br />
              <strong>{program.length}</strong> total weeks,{" "}
              <strong>{frequency}</strong> day(s)/week.
            </p>

            <div className="space-y-4">
              {program.map((wk) => (
                <div
                  key={wk.week}
                  className="bg-gray-50 p-4 rounded-md shadow-sm"
                >
                  <h3 className="font-bold text-lg mb-3">Week {wk.week}</h3>
                  {wk.days.map((day) => {
                    if (day.isPRDay) {
                      // PR Attempt
                      return (
                        <div key={day.dayNumber} className="mb-2">
                          <p className="underline font-medium">
                            Day {day.dayNumber} (PR Attempt)
                          </p>
                          <p className="text-sm mt-1 font-semibold">
                            Warm-Up Sets:
                          </p>
                          <ul className="list-disc ml-5 text-sm mb-2">
                            {day.warmupSets.map((wu, i) => (
                              <li key={i}>
                                {wu.weight}
                                {unitLabel} x {wu.reps} reps (~
                                {Math.round(wu.percentage * 100)}%)
                              </li>
                            ))}
                          </ul>
                          <p className="text-sm font-semibold">
                            Final Attempt:{" "}
                            <strong>
                              {day.finalAttemptWeight} {unitLabel}
                            </strong>{" "}
                            x 1 rep
                          </p>
                        </div>
                      );
                    }
                    // Normal or Taper Day
                    return (
                      <div key={day.dayNumber} className="mb-2">
                        <p className="underline font-medium">
                          Day {day.dayNumber} ({day.label})
                        </p>
                        <p className="text-sm mt-1">
                          {day.sets} x {day.reps} @ ~
                          {Math.round(day.percentage * 100)}% ={" "}
                          <strong>
                            {day.weight} {unitLabel}
                          </strong>
                        </p>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Accessories */}
            <div className="mt-6">
              <h4 className="text-lg font-semibold mb-2">Suggested Accessories</h4>
              <ul className="list-disc ml-6 text-sm text-gray-700 space-y-1">
                {accessories.map((acc, i) => (
                  <li key={i}>
                    <strong>{acc.name}:</strong> {acc.details}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
