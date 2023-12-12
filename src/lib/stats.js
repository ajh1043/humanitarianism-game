import { prisma } from "../server/db/client";
const fsp = require('fs').promises
import map from "../../public/map-nodes.json"

export async function getAllCampStats(courseSectionId) {
  const stats = await prisma.DeployableRegion.findMany({
    where: { courseSectionId },
  });

  // parse it into object with key being the camp id
  // that way we dont have to search for the right one on the client
  let data = {};
  if (stats) {
    for (const camp of stats) {
      data[camp.jsonId] = {
        food: camp.food,
        healthcare: camp.healthcare,
        housing: camp.housing,
        admin: camp.admin,
        refugeesPresent: camp.refugeesPresent,
      };
    }
  }
  return data;
}

export async function getAllRoutes(courseSectionId) {
  const routes = await prisma.Route.findMany({
    where: { courseSectionId },
  });
  let data = {};
  if (routes) {
    for (const route of routes) {
      data[route.jsonId] = {
        isOpen: route.isOpen,
        supplyCap: route.supplyCap,
      };
    }
  }
  return data;
}

export async function getAllGens(courseSectionId) {
  const gens = await prisma.RefugeeGen.findMany({
    where: {
      courseSectionId,
    },
  });
  let data = {};
  if (gens) {
    for (const gen of gens) {
      data[gen.jsonId] = {
        genType: gen.genType,
        totalRefugees: gen.totalRefugees,
        newRefugees: gen.newRefugees,
        food: gen.food,
        healthcare: gen.healthcare,
        admin: gen.admin,
      };
    }
  }
  return data;
}

export async function getGen(courseSectionId, jsonId) {
  const gen = await prisma.RefugeeGen.findFirst({
    where: {
      jsonId: jsonId,
      courseSectionId: courseSectionId,
    },
  });
  return gen;
}

export async function updateGen(data, genId) {
  await prisma.RefugeeGen.update({
    where: {
      id: genId,
    },
    data: {
      totalRefugees: parseInt(data.totalRefugees),
      newRefugees: parseInt(data.newRefugees),
      food: parseInt(data.food),
      healthcare: parseInt(data.healthcare),
      admin: parseInt(data.admin),
      genType: data.genType,
    },
  });
}

export async function resetAllStats(courseSectionId) {
    try {
        await prisma.DeployableRegion.updateMany({
          where: {
            courseSectionId,
          },
          data: {
            food: 0,
            healthcare: 0,
            housing: 0,
            admin: 0,
            refugeesPresent: 0,
          },
        });
        await prisma.RefugeeGen.updateMany({
          where: {
            courseSectionId,
          },
          data: {
            genType: "ORDERLY",
            totalRefugees: 0,
            newRefugees: 0,
            food: 0,
            healthcare: 0,
            admin: 0,
          },
        });
        await prisma.Route.updateMany({
          where: {
            courseSectionId,
          },
          data: {
            isOpen: true,
            supplyCap: 1,
          }
        });
      } catch (error) {
        console.log("Error resetting stats: ", error);
        throw error;
      }  
}

export async function deleteAllStats(courseSectionId) {
  try {
    await prisma.DeployableRegion.deleteMany({
      where: {
        courseSectionId,
      },
    });
    await prisma.RefugeeGen.deleteMany({
      where: {
        courseSectionId,
      },
    });
    await prisma.Route.deleteMany({
      where: {
        courseSectionId,
      },
    });
  } catch (error) {
    console.log("Error deleting stats: ", error);
    throw error;
  }
}

export async function createSectionStats(courseSectionId) {
  const mapData = map;
  try {
    const section = parseInt(courseSectionId);
    Object.entries(mapData["regions"]).map(async ([regionName, regionData]) => {
      await prisma.deployableRegion.create({
        data: {
          courseSectionId: section,
          jsonId: parseInt(regionName),
        },
      });
      if ("gens" in regionData) {
        Object.keys(regionData["gens"]).map(async (genName) => {
            await prisma.refugeeGen.create({
            data: {
                courseSectionId: section,
                jsonId: parseInt(genName),
            },
            });
        });
      }
    });
    Object.keys(mapData["paths"]).map(async (path) => {
        await prisma.Route.create({
            data: {
              courseSectionId: section,
              jsonId: parseInt(path),
            },
          });
    });
  } catch (error) {}
}
