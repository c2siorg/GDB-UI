import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import SessionBadge from "../SessionBadge";
import { DataContext } from "../../../context/DataContext";

describe("SessionBadge", () => {
  it("renders status mapping and session id visibility from context", () => {
    const { rerender } = render(
      <DataContext.Provider
        value={{
          sessionId: "abcd1234-efgh-5678",
          connectionStatus: "Connecting...",
        }}
      >
        <SessionBadge />
      </DataContext.Provider>,
    );

    expect(screen.getByText("Connecting...")).toBeInTheDocument();
    expect(screen.queryByText("#abcd1234")).not.toBeInTheDocument();
    expect(document.querySelector(".status-dot")).toHaveClass(
      "status-connecting",
    );

    rerender(
      <DataContext.Provider
        value={{
          sessionId: "abcd1234-efgh-5678",
          connectionStatus: "Connected",
        }}
      >
        <SessionBadge />
      </DataContext.Provider>,
    );

    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByText("#abcd1234")).toBeInTheDocument();
    expect(document.querySelector(".status-dot")).toHaveClass(
      "status-connected",
    );

    rerender(
      <DataContext.Provider
        value={{
          sessionId: "abcd1234-efgh-5678",
          connectionStatus: "Disconnected",
        }}
      >
        <SessionBadge />
      </DataContext.Provider>,
    );

    expect(screen.getByText("Disconnected")).toBeInTheDocument();
    expect(screen.queryByText("#abcd1234")).not.toBeInTheDocument();
    expect(document.querySelector(".status-dot")).toHaveClass(
      "status-disconnected",
    );
  });
});
