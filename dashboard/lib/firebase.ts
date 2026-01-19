/**
 * Firebase Integration for Nestly
 *
 * Multi-tier memory system using Firebase Realtime Database (hot) and Firestore (warm)
 *
 * @module lib/firebase
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  get,
  set,
  push,
  update,
  remove,
  onValue,
  query,
  orderByChild,
  limitToLast,
  Database,
  DatabaseReference,
  Unsubscribe
} from 'firebase/database';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query as firestoreQuery,
  where,
  orderBy,
  limit,
  Firestore,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';

// ============================================================================
// CONFIGURATION
// ============================================================================

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ============================================================================
// INITIALIZATION
// ============================================================================

let app: FirebaseApp | null = null;
let database: Database | null = null;
let firestore: Firestore | null = null;

/**
 * Initialize Firebase app (singleton pattern)
 */
export function initializeFirebase(): FirebaseApp | null {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn('Firebase config not set. Please configure environment variables.');
    return null;
  }

  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  return app;
}

/**
 * Get Firebase Realtime Database instance
 */
export function getRealtimeDatabase(): Database | null {
  if (!database) {
    const app = initializeFirebase();
    if (app) {
      database = getDatabase(app);
    }
  }
  return database;
}

/**
 * Get Firestore instance
 */
export function getFirestoreDb(): Firestore | null {
  if (!firestore) {
    const app = initializeFirebase();
    if (app) {
      firestore = getFirestore(app);
    }
  }
  return firestore;
}

/**
 * Check if Firebase is properly configured
 */
export function isFirebaseConfigured(): boolean {
  return !!(firebaseConfig.apiKey && firebaseConfig.projectId);
}

// ============================================================================
// MEMORY TYPES
// ============================================================================

export type MemoryType = 'episodic' | 'semantic' | 'procedural' | 'working';
export type MemoryTier = 'hot' | 'warm' | 'cold';

export interface MemorySource {
  surface: 'desktop' | 'code' | 'dashboard' | 'api' | 'agent';
  backend: 'firebase' | 'firestore' | 'obsidian' | 'gdrive' | 'github' | 'local';
  userId?: string;
  sessionId?: string;
}


export interface Memory {
  id: string;
  type: MemoryType;
  content: string;
  context?: string;
  tags: string[];
  importance: number; // 0-1
  timestamp: string;
  expiresAt?: string;
  source?: MemorySource;
  relatedIds?: string[];
  metadata?: Record<string, unknown>;
}

export interface FamilyMemberData {
  id: string;
  name: string;
  role: 'admin' | 'member' | 'child';
  email?: string;
  avatar?: string;
  location?: string;
  status?: 'home' | 'work' | 'school' | 'away';
  lastSeen?: string;
  preferences?: Record<string, unknown>;
}

export interface TaskData {
  id: string;
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  allDay?: boolean;
  location?: string;
  attendees?: string[];
  color?: string;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    until?: string;
  };
}

// ============================================================================
// HOT TIER: REALTIME DATABASE OPERATIONS
// ============================================================================

/**
 * Read data from Realtime Database
 */
export async function rtdbGet<T>(path: string): Promise<T | null> {
  const db = getRealtimeDatabase();
  if (!db) return null;

  try {
    const snapshot = await get(ref(db, path));
    return snapshot.exists() ? snapshot.val() as T : null;
  } catch (error) {
    console.error(`RTDB read error at ${path}:`, error);
    return null;
  }
}

/**
 * Write data to Realtime Database
 */
export async function rtdbSet<T>(path: string, data: T): Promise<boolean> {
  const db = getRealtimeDatabase();
  if (!db) return false;

  try {
    await set(ref(db, path), data);
    return true;
  } catch (error) {
    console.error(`RTDB write error at ${path}:`, error);
    return false;
  }
}

/**
 * Push new data to a list in Realtime Database
 */
export async function rtdbPush<T>(path: string, data: T): Promise<string | null> {
  const db = getRealtimeDatabase();
  if (!db) return null;

  try {
    const newRef = push(ref(db, path));
    await set(newRef, data);
    return newRef.key;
  } catch (error) {
    console.error(`RTDB push error at ${path}:`, error);
    return null;
  }
}

/**
 * Update data in Realtime Database
 */
export async function rtdbUpdate(path: string, updates: Record<string, unknown>): Promise<boolean> {
  const db = getRealtimeDatabase();
  if (!db) return false;

  try {
    await update(ref(db, path), updates);
    return true;
  } catch (error) {
    console.error(`RTDB update error at ${path}:`, error);
    return false;
  }
}

/**
 * Delete data from Realtime Database
 */
export async function rtdbDelete(path: string): Promise<boolean> {
  const db = getRealtimeDatabase();
  if (!db) return false;

  try {
    await remove(ref(db, path));
    return true;
  } catch (error) {
    console.error(`RTDB delete error at ${path}:`, error);
    return false;
  }
}

/**
 * Subscribe to realtime updates
 */
export function rtdbSubscribe<T>(
  path: string,
  callback: (data: T | null) => void
): Unsubscribe | null {
  const db = getRealtimeDatabase();
  if (!db) return null;

  return onValue(ref(db, path), (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() as T : null);
  });
}

// ============================================================================
// WARM TIER: FIRESTORE OPERATIONS
// ============================================================================

/**
 * Get a document from Firestore
 */
export async function firestoreGetDoc<T extends DocumentData>(
  collectionName: string,
  docId: string
): Promise<T | null> {
  const db = getFirestoreDb();
  if (!db) return null;

  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as T : null;
  } catch (error) {
    console.error(`Firestore get error:`, error);
    return null;
  }
}

/**
 * Get all documents from a collection
 */
export async function firestoreGetCollection<T extends DocumentData>(
  collectionName: string,
  constraints?: QueryConstraint[]
): Promise<T[]> {
  const db = getFirestoreDb();
  if (!db) return [];

  try {
    const collRef = collection(db, collectionName);
    const q = constraints ? firestoreQuery(collRef, ...constraints) : collRef;
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  } catch (error) {
    console.error(`Firestore collection error:`, error);
    return [];
  }
}

/**
 * Set a document in Firestore
 */
export async function firestoreSetDoc<T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: T
): Promise<boolean> {
  const db = getFirestoreDb();
  if (!db) return false;

  try {
    await setDoc(doc(db, collectionName, docId), data);
    return true;
  } catch (error) {
    console.error(`Firestore set error:`, error);
    return false;
  }
}

/**
 * Update a document in Firestore
 */
export async function firestoreUpdateDoc(
  collectionName: string,
  docId: string,
  updates: Partial<DocumentData>
): Promise<boolean> {
  const db = getFirestoreDb();
  if (!db) return false;

  try {
    await updateDoc(doc(db, collectionName, docId), updates);
    return true;
  } catch (error) {
    console.error(`Firestore update error:`, error);
    return false;
  }
}

/**
 * Delete a document from Firestore
 */
export async function firestoreDeleteDoc(
  collectionName: string,
  docId: string
): Promise<boolean> {
  const db = getFirestoreDb();
  if (!db) return false;

  try {
    await deleteDoc(doc(db, collectionName, docId));
    return true;
  } catch (error) {
    console.error(`Firestore delete error:`, error);
    return false;
  }
}

// ============================================================================
// NESTLY-SPECIFIC MEMORY OPERATIONS
// ============================================================================

/**
 * Default source for memories created from the dashboard
 */
const DASHBOARD_SOURCE: MemorySource = {
  surface: 'dashboard',
  backend: 'firebase'
};

/**
 * Create a new memory
 */
export async function createMemory(memory: Omit<Memory, 'id' | 'timestamp'>): Promise<string | null> {
  const data: Memory = {
    ...memory,
    id: '', // Will be set by push
    timestamp: new Date().toISOString(),
    source: memory.source ?? DASHBOARD_SOURCE,
  };

  // Store in hot tier for quick access (unified collection name: 'memories')
  const id = await rtdbPush('memories', data);

  // Also store important memories in warm tier for persistence
  if (id && memory.importance >= 0.7) {
    await firestoreSetDoc('memories', id, { ...data, id });
  }

  return id;
}

/**
 * Search memories by tags
 */
export async function searchMemoriesByTags(tags: string[]): Promise<Memory[]> {
  const allMemories = await rtdbGet<Record<string, Memory>>('memories');
  if (!allMemories) return [];

  return Object.values(allMemories).filter(memory =>
    tags.some(tag => memory.tags?.includes(tag))
  );
}

/**
 * Get recent memories
 */
export async function getRecentMemories(count: number = 10): Promise<Memory[]> {
  const allMemories = await rtdbGet<Record<string, Memory>>('memories');
  if (!allMemories) return [];

  return Object.values(allMemories)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, count);
}

/**
 * Get high-importance memories
 */
export async function getImportantMemories(minImportance: number = 0.8): Promise<Memory[]> {
  const allMemories = await rtdbGet<Record<string, Memory>>('memories');
  if (!allMemories) return [];

  return Object.values(allMemories)
    .filter(memory => memory.importance >= minImportance)
    .sort((a, b) => b.importance - a.importance);
}

// ============================================================================
// FAMILY DATA OPERATIONS
// ============================================================================

/**
 * Get all family members
 */
export async function getFamilyMembers(): Promise<FamilyMemberData[]> {
  const data = await rtdbGet<Record<string, FamilyMemberData>>('family/members');
  return data ? Object.values(data) : [];
}

/**
 * Update family member status
 */
export async function updateFamilyMemberStatus(
  memberId: string,
  status: FamilyMemberData['status'],
  location?: string
): Promise<boolean> {
  return rtdbUpdate(`family/members/${memberId}`, {
    status,
    location,
    lastSeen: new Date().toISOString(),
  });
}

/**
 * Get family tasks
 */
export async function getFamilyTasks(): Promise<TaskData[]> {
  const data = await rtdbGet<Record<string, TaskData>>('tasks');
  return data ? Object.values(data) : [];
}

/**
 * Create a family task
 */
export async function createFamilyTask(task: Omit<TaskData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
  const now = new Date().toISOString();
  const data: TaskData = {
    ...task,
    id: '', // Will be set by push
    createdAt: now,
    updatedAt: now,
  };
  return rtdbPush('tasks', data);
}

/**
 * Update task status
 */
export async function updateTaskStatus(
  taskId: string,
  status: TaskData['status']
): Promise<boolean> {
  const updates: Partial<TaskData> = {
    status,
    updatedAt: new Date().toISOString(),
  };

  if (status === 'completed') {
    updates.completedAt = new Date().toISOString();
  }

  return rtdbUpdate(`tasks/${taskId}`, updates);
}

// ============================================================================
// CONFIG OPERATIONS
// ============================================================================

/**
 * Get configuration value
 */
export async function getConfig<T>(key: string): Promise<T | null> {
  return rtdbGet<T>(`config/${key}`);
}

/**
 * Set configuration value
 */
export async function setConfig<T>(key: string, value: T): Promise<boolean> {
  return rtdbSet(`config/${key}`, value);
}

// ============================================================================
// REALTIME SUBSCRIPTIONS
// ============================================================================

/**
 * Subscribe to family member updates
 */
export function subscribeFamilyMembers(
  callback: (members: FamilyMemberData[]) => void
): Unsubscribe | null {
  return rtdbSubscribe<Record<string, FamilyMemberData>>('family/members', (data) => {
    callback(data ? Object.values(data) : []);
  });
}

/**
 * Subscribe to task updates
 */
export function subscribeTasks(
  callback: (tasks: TaskData[]) => void
): Unsubscribe | null {
  return rtdbSubscribe<Record<string, TaskData>>('tasks', (data) => {
    callback(data ? Object.values(data) : []);
  });
}

/**
 * Subscribe to memory updates (unified collection name)
 */
export function subscribeMemories(
  callback: (memories: Memory[]) => void
): Unsubscribe | null {
  return rtdbSubscribe<Record<string, Memory>>('memories', (data) => {
    callback(data ? Object.values(data) : []);
  });
}

// ============================================================================
// EXPORT FIRESTORE QUERY HELPERS
// ============================================================================

export { where, orderBy, limit } from 'firebase/firestore';
