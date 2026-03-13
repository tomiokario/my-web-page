import React from "react";
import { matchPath } from "react-router-dom";
import { LocaleMessages } from "./locales/types";
import Home from "./pages/Home";
import ProfileCV from "./pages/ProfileCV";
import Publications from "./pages/Publications";
import Works from "./pages/Works";
import ComputerSystem2025 from "./pages/ComputerSystem2025";

export type AppRouteKey =
  | "home"
  | "profileCV"
  | "publications"
  | "works"
  | "computerSystem2025";

export interface AppRouteDefinition {
  key: AppRouteKey;
  path: string;
  element: React.ReactElement;
  navLabelKey?: keyof LocaleMessages["header"];
  mobileNavLabelKey?: keyof LocaleMessages["header"];
  titleKey?: keyof LocaleMessages["subheader"];
}

export const appRoutes: AppRouteDefinition[] = [
  {
    key: "home",
    path: "/",
    element: <Home />,
    navLabelKey: "home",
    titleKey: "home",
  },
  {
    key: "profileCV",
    path: "/profile-cv",
    element: <ProfileCV />,
    navLabelKey: "profileCV",
    mobileNavLabelKey: "profileCVShort",
    titleKey: "profileCV",
  },
  {
    key: "publications",
    path: "/publications",
    element: <Publications />,
    navLabelKey: "publications",
    titleKey: "publications",
  },
  {
    key: "works",
    path: "/works",
    element: <Works />,
    navLabelKey: "works",
    titleKey: "works",
  },
  {
    key: "computerSystem2025",
    path: "/works/computer-system-2025",
    element: <ComputerSystem2025 />,
    titleKey: "computerSystem2025",
  },
];

export const navigationRoutes = appRoutes.filter(
  (route): route is AppRouteDefinition & { navLabelKey: keyof LocaleMessages["header"] } =>
    Boolean(route.navLabelKey)
);

export function findRouteByPath(pathname: string): AppRouteDefinition | undefined {
  const exactMatch = appRoutes.find((route) =>
    Boolean(matchPath({ path: route.path, end: true }, pathname))
  );

  if (exactMatch) {
    return exactMatch;
  }

  return [...appRoutes]
    .filter(
      (route) =>
        route.titleKey !== undefined &&
        route.path !== "/" &&
        pathname.startsWith(`${route.path}/`)
    )
    .sort((left, right) => right.path.length - left.path.length)[0];
}
