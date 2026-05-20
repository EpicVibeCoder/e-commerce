import { render, screen } from "@testing-library/react";
import Page from "./page";
test("renders", () => {
      render(<Page />);
      expect(screen.getByRole("main")).toBeInTheDocument();
});
