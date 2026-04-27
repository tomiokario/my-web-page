import { initializeGoogleAnalytics } from "../utils/googleAnalytics";

describe("initializeGoogleAnalytics", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    delete window.dataLayer;
    delete window.gtag;
  });

  test("does not add the Google Analytics script without a measurement ID", () => {
    // Arrange & Act
    initializeGoogleAnalytics("");

    // Assert
    expect(document.querySelector("script[src*='googletagmanager']")).toBeNull();
    expect(window.dataLayer).toBeUndefined();
    expect(window.gtag).toBeUndefined();
  });

  test("adds and configures the Google Analytics script with a measurement ID", () => {
    // Arrange & Act
    initializeGoogleAnalytics("G-TEST12345");

    // Assert
    expect(document.getElementById("google-analytics-gtag")).toHaveAttribute(
      "src",
      "https://www.googletagmanager.com/gtag/js?id=G-TEST12345"
    );
    expect(window.dataLayer).toEqual([
      ["js", expect.any(Date)],
      ["config", "G-TEST12345"],
    ]);
  });

  test("does not add duplicate scripts when initialized more than once", () => {
    // Arrange & Act
    initializeGoogleAnalytics("G-TEST12345");
    initializeGoogleAnalytics("G-TEST12345");

    // Assert
    expect(document.querySelectorAll("script[src*='googletagmanager']")).toHaveLength(1);
  });
});
