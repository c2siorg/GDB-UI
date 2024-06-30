// Header.test.js
import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Header from "../Header.jsx";

test("renders Header component", () => {
  const { getByAltText, getByText } = render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>
  );

  const imgElement = getByAltText("C2si");
  expect(imgElement).toBeInTheDocument();
  expect(imgElement).toHaveAttribute("src", "/src/assets/c2si.png"); // Ensure the path is correct

  const loginLink = getByText("Login");
  expect(loginLink).toBeInTheDocument();
  expect(loginLink).toHaveAttribute("href", "/login");
});
