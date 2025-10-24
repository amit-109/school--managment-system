import React from "react";

const LoadingOverlay = ({ isLoading, children }) => {
  return (
    <div className="relative">
      {children}

      {/* Overlay with fade and theme support */}
      <div
        className={`fixed inset-0 flex items-center justify-center transition-all duration-300 z-[9999] ${
          isLoading
            ? "opacity-100 visible bg-white/70 dark:bg-black/40 backdrop-blur-sm"
            : "opacity-0 invisible"
        }`}
      >
        <div className="relative flex flex-col items-center justify-center">
          {/* Spinner */}
          <div
            className="w-14 h-14 sm:w-20 sm:h-20 rounded-full border-[6px] border-solid animate-spin"
            style={{
              borderColor: "rgba(73,144,226,0.2)",
              borderTopColor: "#4990E2",
              boxShadow: "0 0 8px rgba(73,144,226,0.4)",
              animationDuration: "1s",
            }}
          ></div>

          {/* Text */}
          <span className="absolute text-[#4990E2] dark:text-[#60A5FA] font-semibold text-sm sm:text-base tracking-wide select-none">
            Loading
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
