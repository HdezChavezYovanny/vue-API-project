import axios from "axios";

export async function fetchStations() {
  const url =
    "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/";

  try {
    const resp = await axios.get(url, { responseType: "json" });
    console.log("fetchStations: HTTP", resp.status, "top-level keys:", Object.keys(resp.data || {}));

    const list = resp.data?.ListaEESSPrecio;
    console.log("fetchStations: ListaEESSPrecio length =", Array.isArray(list) ? list.length : list);

    return (list || []).map((raw, idx) => {
      // tolerar claves con/sin acento
      const rotulo = raw["Rótulo"] ?? raw["Rotulo"] ?? null;
      const direccion = raw["Dirección"] ?? raw["Direccion"] ?? "";

      return {
        id: raw["IDEESS"] || idx,
        brand: rotulo ? String(rotulo).trim() : null,
        address: `${direccion} ${raw["Localidad"] ?? ""}`.trim(),
        municipio: raw["Municipio"] ?? "",
        provincia: raw["Provincia"] ?? "",
        horario: raw["Horario"] ?? "",
        lat: parseFloat(String(raw["Latitud"] ?? "").replace(",", ".")) || NaN,
        lon:
          parseFloat(
            String(raw["Longitud (WGS84)"] ?? raw["Longitud"] ?? "").replace(",", ".")
          ) || NaN,
        raw,
      };
    });
  } catch (err) {
    console.error("fetchStations error:", err);
    throw err; 
  }
}
