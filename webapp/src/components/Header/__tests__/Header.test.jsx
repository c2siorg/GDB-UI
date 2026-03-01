import React from "react";
import { render, screen } from "../../../test-utils";
import Header from "../Header.jsx";

test("renders Header component", () => {
  render(<Header />);

  const imgElement = screen.getByAltText(/C2SI/i);
  expect(imgElement).toBeInTheDocument();
  expect(imgElement).toHaveAttribute("src", "/src/assets/c2si.png"); // Ensure the path is correct

  const loginLink = screen.getByText("Login");
  expect(loginLink).toBeInTheDocument();
  expect(loginLink).toHaveAttribute("href", "/login");
});
