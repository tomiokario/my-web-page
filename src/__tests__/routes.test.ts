import { findRouteByPath, navigationRoutes } from "../routes";

describe("routes", () => {
  test("returns metadata for an exact route match", () => {
    expect(findRouteByPath("/works/computer-system-2025")?.key).toBe("computerSystem2025");
  });

  test("falls back to the nearest parent route for nested paths", () => {
    expect(findRouteByPath("/works/unknown-detail")?.key).toBe("works");
  });

  test("exposes top-level navigation routes in display order", () => {
    expect(navigationRoutes.map((route) => route.key)).toEqual([
      "home",
      "profileCV",
      "publications",
      "works",
    ]);
  });
});
