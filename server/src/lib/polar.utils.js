export const parseIsoDuration = (durationStr) => {
  if (!durationStr) return 0;
  const matches = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:([\d.]+)S)?/);
  if (!matches) return 0;

  const hours = parseFloat(matches[1] || 0);
  const minutes = parseFloat(matches[2] || 0);
  const seconds = parseFloat(matches[3] || 0);

  return hours * 3600 + minutes * 60 + seconds;
};

export const parseSamples = (samples, sampleType) => {
  if (!samples || !Array.isArray(samples)) return undefined;

  const targetSample = samples.find(
    (s) => parseInt(s.sample_type) === sampleType,
  );
  if (!targetSample || !targetSample.data) return undefined;

  return targetSample.data.split(",").map(Number);
};

export const parseRoute = (routeData) => {
  if (!routeData || !Array.isArray(routeData) || routeData.length === 0) {
    return undefined;
  }

  return {
    type: "LineString",
    coordinates: routeData.map((point) => [point.longitude, point.latitude]),
  };
};

export const parseZones = (zones) => {
  if (!zones || !Array.isArray(zones)) return undefined;

  return zones.map((zone) => ({
    index: zone.index,
    lowerLimit: zone.lower_limit,
    upperLimit: zone.upper_limit,
    duration: parseIsoDuration(zone.in_zone),
  }));
};
