const variants = {
  error: "bg-red-50 text-red-600",
  success: "bg-green-50 text-green-600",
  warning: "bg-yellow-50 text-yellow-600",
  info: "bg-blue-50 text-blue-600",
};

export default function Alert({ children, variant = "error", className = "" }) {
  if (!children) return null;

  return (
    <div className={`p-3 rounded-lg text-sm ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}
