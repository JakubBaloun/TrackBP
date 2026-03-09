import {
  parseIsoDuration,
  parseSamples,
  parseRoute,
  parseZones,
} from "../../../src/lib/polar.utils.js";

describe("Polar Utils", () => {
  describe("parseIsoDuration", () => {
    it("should parse hours, minutes, and seconds", () => {
      expect(parseIsoDuration("PT1H30M45S")).toBe(5445);
    });

    it("should parse only hours", () => {
      expect(parseIsoDuration("PT2H")).toBe(7200);
    });

    it("should parse only minutes", () => {
      expect(parseIsoDuration("PT45M")).toBe(2700);
    });

    it("should parse only seconds", () => {
      expect(parseIsoDuration("PT30S")).toBe(30);
    });

    it("should parse decimal seconds", () => {
      expect(parseIsoDuration("PT1M30.5S")).toBe(90.5);
    });

    it("should return 0 for null/undefined", () => {
      expect(parseIsoDuration(null)).toBe(0);
      expect(parseIsoDuration(undefined)).toBe(0);
    });

    it("should return 0 for invalid format", () => {
      expect(parseIsoDuration("invalid")).toBe(0);
      expect(parseIsoDuration("1:30:45")).toBe(0);
    });

    it("should parse hours and seconds without minutes", () => {
      expect(parseIsoDuration("PT1H30S")).toBe(3630);
    });
  });

  describe("parseSamples", () => {
    const mockSamples = [
      { sample_type: "0", data: "120,125,130,135" },
      { sample_type: "1", data: "2.5,2.6,2.7,2.8" },
      { sample_type: "10", data: "80,82,84,86" },
    ];

    it("should parse heart rate samples (type 0)", () => {
      const result = parseSamples(mockSamples, 0);
      expect(result).toEqual([120, 125, 130, 135]);
    });

    it("should parse speed samples (type 1)", () => {
      const result = parseSamples(mockSamples, 1);
      expect(result).toEqual([2.5, 2.6, 2.7, 2.8]);
    });

    it("should parse cadence samples (type 10)", () => {
      const result = parseSamples(mockSamples, 10);
      expect(result).toEqual([80, 82, 84, 86]);
    });

    it("should return undefined for non-existent sample type", () => {
      expect(parseSamples(mockSamples, 99)).toBeUndefined();
    });

    it("should return undefined for null/undefined samples", () => {
      expect(parseSamples(null, 0)).toBeUndefined();
      expect(parseSamples(undefined, 0)).toBeUndefined();
    });

    it("should return undefined for non-array samples", () => {
      expect(parseSamples("not an array", 0)).toBeUndefined();
      expect(parseSamples({}, 0)).toBeUndefined();
    });

    it("should return undefined if sample has no data", () => {
      const samplesWithoutData = [{ sample_type: "0" }];
      expect(parseSamples(samplesWithoutData, 0)).toBeUndefined();
    });
  });

  describe("parseRoute", () => {
    it("should convert route points to GeoJSON LineString", () => {
      const routeData = [
        { latitude: 50.0, longitude: 14.0 },
        { latitude: 50.1, longitude: 14.1 },
        { latitude: 50.2, longitude: 14.2 },
      ];

      const result = parseRoute(routeData);

      expect(result).toEqual({
        type: "LineString",
        coordinates: [
          [14.0, 50.0],
          [14.1, 50.1],
          [14.2, 50.2],
        ],
      });
    });

    it("should return undefined for null/undefined", () => {
      expect(parseRoute(null)).toBeUndefined();
      expect(parseRoute(undefined)).toBeUndefined();
    });

    it("should return undefined for empty array", () => {
      expect(parseRoute([])).toBeUndefined();
    });

    it("should return undefined for non-array", () => {
      expect(parseRoute("not an array")).toBeUndefined();
    });
  });

  describe("parseZones", () => {
    it("should parse heart rate zones with duration conversion", () => {
      const zonesData = [
        { index: 1, lower_limit: 100, upper_limit: 120, in_zone: "PT10M" },
        { index: 2, lower_limit: 120, upper_limit: 140, in_zone: "PT15M30S" },
        { index: 3, lower_limit: 140, upper_limit: 160, in_zone: "PT5M" },
      ];

      const result = parseZones(zonesData);

      expect(result).toEqual([
        { index: 1, lowerLimit: 100, upperLimit: 120, duration: 600 },
        { index: 2, lowerLimit: 120, upperLimit: 140, duration: 930 },
        { index: 3, lowerLimit: 140, upperLimit: 160, duration: 300 },
      ]);
    });

    it("should return undefined for null/undefined", () => {
      expect(parseZones(null)).toBeUndefined();
      expect(parseZones(undefined)).toBeUndefined();
    });

    it("should return undefined for non-array", () => {
      expect(parseZones("not an array")).toBeUndefined();
    });

    it("should handle empty zones array", () => {
      expect(parseZones([])).toEqual([]);
    });
  });
});
