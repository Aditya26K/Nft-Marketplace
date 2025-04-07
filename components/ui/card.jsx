export function Card({ className, children }) {
    return (
      <div className={`bg-gray-800 p-5 rounded-lg shadow-lg ${className}`}>
        {children}
      </div>
    );
  }
  
  export function CardHeader({ className, children }) {
    return <div className={`pb-3 border-b border-gray-700 ${className}`}>{children}</div>;
  }
  
  export function CardTitle({ className, children }) {
    return <h2 className={`text-xl font-bold ${className}`}>{children}</h2>;
  }
  
  export function CardContent({ className, children }) {
    return <div className={`pt-3 ${className}`}>{children}</div>;
  }