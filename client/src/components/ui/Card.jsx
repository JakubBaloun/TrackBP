export default function Card({ children, className = "", hover = false }) {
  return (
    <div
      className={`
        bg-white rounded-2xl shadow-sm border border-gray-100
        ${hover ? "hover:shadow-md hover:border-gray-200 transition-shadow cursor-pointer" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }) {
  return (
    <div className={`px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = "" }) {
  return <div className={`p-4 sm:p-6 ${className}`}>{children}</div>;
}
