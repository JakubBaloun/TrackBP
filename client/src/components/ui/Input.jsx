export default function Input({
  label,
  id,
  error,
  helper,
  className = "",
  ...props
}) {
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`
          block w-full px-4 py-2.5
          bg-white border rounded-xl shadow-sm
          text-gray-900 placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-shadow
          ${error ? "border-red-300 focus:ring-red-500" : "border-gray-200"}
        `}
        {...props}
      />
      {helper && !error && (
        <p className="mt-1.5 text-sm text-gray-500">{helper}</p>
      )}
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export function Textarea({
  label,
  id,
  error,
  className = "",
  rows = 3,
  ...props
}) {
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          {label}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        className={`
          block w-full px-4 py-2.5
          bg-white border rounded-xl shadow-sm
          text-gray-900 placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-shadow resize-none
          ${error ? "border-red-300 focus:ring-red-500" : "border-gray-200"}
        `}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
}
