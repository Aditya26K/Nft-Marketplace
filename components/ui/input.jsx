export function Input({ className, ...props }) {
    return (
      <input
        className={`border border-gray-300 rounded-md px-3 py-2 focus:ring focus:ring-blue-300 ${className}`}
        {...props}
      />
    );
  }