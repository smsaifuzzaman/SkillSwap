import React from "react";

function Toast({ status }) {
  if (!status.message) {
    return null;
  }

  return <div className={`toast ${status.type}`}>{status.message}</div>;
}

export default Toast;
