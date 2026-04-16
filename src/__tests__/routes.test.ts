import { findRouteByPath, navigationRoutes } from "../routes";

describe("routes", () => {
  test("returns metadata for an exact route match", () => {
    expect(findRouteByPath("/works/computer-system-2025")?.key).toBe("computerSystem2025");
  });

  test("returns metadata for the local publication admin route in non-production environments", () => {
    expect(findRouteByPath("/admin/publications")?.key).toBe("publicationAdmin");
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
