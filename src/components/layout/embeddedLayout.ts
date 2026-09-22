export type EmbeddedLocation = Pick<Location, "search" | "hash">;

export type EmbeddedLayoutFlags = {
  isEmbed: boolean;
  hideSidebar: boolean;
  hideTopbar: boolean;
};

function mergedSearchParams(location?: EmbeddedLocation): URLSearchParams {
  const params = new URLSearchParams(location?.search ?? "");
  const hash = location?.hash ?? "";
  const queryIndex = hash.indexOf("?");

  if (queryIndex !== -1) {
    const hashParams = new URLSearchParams(hash.slice(queryIndex));
    hashParams.forEach((value, key) => {
      if (!params.has(key)) params.set(key, value);
    });
  }

  return params;
}

export function getEmbeddedLayoutFlags(
  location?: EmbeddedLocation,
  entryFlags?: EmbeddedLayoutFlags,
): EmbeddedLayoutFlags {
  const params = mergedSearchParams(location);
  const isEmbed =
    params.get("embed") === "true" ||
    params.get("embedded") === "true" ||
    entryFlags?.isEmbed === true;

  return {
    isEmbed,
    hideSidebar:
      isEmbed ||
      entryFlags?.hideSidebar === true ||
      params.get("hideSidebar") === "true" ||
      params.get("hide_sidebar") === "true",
    hideTopbar:
      isEmbed ||
      entryFlags?.hideTopbar === true ||
      params.get("hideTopbar") === "true" ||
      params.get("hide_topbar") === "true",
  };
}
