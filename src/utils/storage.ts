/**
 * Storage Manager for Saved RAB Projects
 */

import { SavedProject } from '../types/rab';
import { DEFAULT_PROJECT, TEMPLATE_PROJECTS } from '../data/defaultCatalog';

const STORAGE_KEY = 'rab_rumah_saved_projects_v1';
const ACTIVE_PROJECT_ID_KEY = 'rab_rumah_active_project_id_v1';

export function normalizeProject(project: Partial<SavedProject>): SavedProject {
  return {
    ...DEFAULT_PROJECT,
    ...project,
    id: project.id || 'proj_' + Date.now(),
    name: project.name || DEFAULT_PROJECT.name,
    clientName: project.clientName || '',
    location: project.location || '',
    notes: project.notes || '',
    cementBagWeight: project.cementBagWeight || 50,
    floors: project.floors || 1,
    houseLength: project.houseLength ?? DEFAULT_PROJECT.houseLength,
    houseWidth: project.houseWidth ?? DEFAULT_PROJECT.houseWidth,
    groundFloorArea: project.groundFloorArea ?? DEFAULT_PROJECT.groundFloorArea,
    secondFloorArea: project.secondFloorArea ?? 0,
    wallHeight: project.wallHeight ?? DEFAULT_PROJECT.wallHeight,
    wallType: project.wallType || 'hebel',
    ceilingType: project.ceilingType || 'gypsum',
    ratePerM2: project.ratePerM2 ?? DEFAULT_PROJECT.ratePerM2,
    useManualBenchmark: Boolean(project.useManualBenchmark),
    scopeMode: project.scopeMode || 'turnkey',
    customScopes: {
      ...DEFAULT_PROJECT.customScopes,
      ...(project.customScopes || {}),
    },
    profitMarginPercent: project.profitMarginPercent ?? DEFAULT_PROJECT.profitMarginPercent,
    contingencyPercent: project.contingencyPercent ?? DEFAULT_PROJECT.contingencyPercent,
    materialPriceOverrides: project.materialPriceOverrides || {},
    laborRateOverrides: project.laborRateOverrides || {},
    useFloorPlanSync: Boolean(project.useFloorPlanSync),
    floorPlanRooms: Array.isArray(project.floorPlanRooms) && project.floorPlanRooms.length > 0 
      ? project.floorPlanRooms 
      : [...DEFAULT_PROJECT.floorPlanRooms],
  };
}

export function getSavedProjects(): SavedProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial: SavedProject[] = [DEFAULT_PROJECT, ...TEMPLATE_PROJECTS].map(normalizeProject);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map(normalizeProject);
    }
    return [normalizeProject(DEFAULT_PROJECT)];
  } catch (err) {
    console.error('Failed to load saved projects from localStorage:', err);
    return [normalizeProject(DEFAULT_PROJECT)];
  }
}

export function saveProject(project: SavedProject): SavedProject[] {
  try {
    const currentList = getSavedProjects();
    const now = new Date().toISOString();
    const updatedProject = normalizeProject({
      ...project,
      updatedAt: now,
    });

    const existingIndex = currentList.findIndex(p => p.id === project.id);
    let newList: SavedProject[];

    if (existingIndex >= 0) {
      newList = [...currentList];
      newList[existingIndex] = updatedProject;
    } else {
      newList = [updatedProject, ...currentList];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    localStorage.setItem(ACTIVE_PROJECT_ID_KEY, updatedProject.id);
    return newList;
  } catch (err) {
    console.error('Failed to save project:', err);
    return getSavedProjects();
  }
}

export function deleteProject(id: string): SavedProject[] {
  try {
    const currentList = getSavedProjects();
    const filtered = currentList.filter(p => p.id !== id);
    const result = filtered.length > 0 ? filtered : [normalizeProject(DEFAULT_PROJECT)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    return result;
  } catch (err) {
    console.error('Failed to delete project:', err);
    return getSavedProjects();
  }
}

export function duplicateProject(source: SavedProject): { project: SavedProject; list: SavedProject[] } {
  const newId = 'proj_' + Date.now();
  const copy: SavedProject = normalizeProject({
    ...source,
    id: newId,
    name: `${source.name || 'Proyek'} (Salinan)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const list = saveProject(copy);
  return { project: copy, list };
}

export function exportProjectsToJson(projects: SavedProject[]): void {
  const normalized = projects.map(normalizeProject);
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(normalized, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `RAB_Proyek_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function getActiveProjectId(): string {
  return localStorage.getItem(ACTIVE_PROJECT_ID_KEY) || DEFAULT_PROJECT.id;
}

export function setActiveProjectId(id: string): void {
  localStorage.setItem(ACTIVE_PROJECT_ID_KEY, id);
}
