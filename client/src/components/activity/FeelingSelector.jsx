const feelings = [
  { value: 1, emoji: "😫", label: "Very Bad", color: "red" },
  { value: 2, emoji: "😕", label: "Bad", color: "orange" },
  { value: 3, emoji: "😐", label: "Okay", color: "yellow" },
  { value: 4, emoji: "🙂", label: "Good", color: "lime" },
  { value: 5, emoji: "😄", label: "Great", color: "green" },
];

const colorClasses = {
  red: "border-red-200 bg-red-50 hover:border-red-300",
  orange: "border-orange-200 bg-orange-50 hover:border-orange-300",
  yellow: "border-yellow-200 bg-yellow-50 hover:border-yellow-300",
  lime: "border-lime-200 bg-lime-50 hover:border-lime-300",
  green: "border-green-200 bg-green-50 hover:border-green-300",
};

const selectedClasses = {
  red: "border-red-500 bg-red-100 ring-2 ring-red-200",
  orange: "border-orange-500 bg-orange-100 ring-2 ring-orange-200",
  yellow: "border-yellow-500 bg-yellow-100 ring-2 ring-yellow-200",
  lime: "border-lime-500 bg-lime-100 ring-2 ring-lime-200",
  green: "border-green-500 bg-green-100 ring-2 ring-green-200",
};

export default function FeelingSelector({ value, onChange, label = "How did you feel?" }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        {label}
      </label>
      <div className="flex gap-1 sm:gap-2">
        {feelings.map((feeling) => (
          <button
            key={feeling.value}
            type="button"
            onClick={() => onChange(feeling.value)}
            className={`
              flex-1 flex flex-col items-center gap-1 py-2 sm:py-3 px-1 sm:px-2 rounded-xl border-2 transition-all
              ${value === feeling.value
                ? selectedClasses[feeling.color]
                : colorClasses[feeling.color]
              }
            `}
          >
            <span className="text-xl sm:text-2xl">{feeling.emoji}</span>
            <span className="text-xs font-medium text-gray-600 hidden sm:block">{feeling.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export const feelingLabels = ["", "Very Bad", "Bad", "Okay", "Good", "Great"];
export const feelingEmojis = ["", "😫", "😕", "😐", "🙂", "😄"];
