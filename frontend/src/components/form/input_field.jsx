export default function InputField({
  label,
  name,
  register,
  error,
  disabled = false,
  readOnly = false,
  disabledVisual = false,
  type = "text",
  placeholder = "",
  inputMode,
  autoComplete,
  className = "",
}) {
  const baseStyles =
    "mt-1 w-full rounded-xl border px-3 py-2 outline-none transition focus:ring-2";

  const errorStyles = error
    ? "border-red-400 focus:ring-red-200"
    : "border-blue-500 focus:ring-blue-500";

  const disabledStyles =
    disabled || readOnly || disabledVisual
      ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-300 focus:ring-0"
      : "";

  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold text-gray-700">
          {label}
        </label>
      )}

      <input
        {...register(name)}
        type={type}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        disabled={disabled}
        readOnly={readOnly}
        className={`${baseStyles} ${errorStyles} ${disabledStyles} ${className}`}
      />

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}