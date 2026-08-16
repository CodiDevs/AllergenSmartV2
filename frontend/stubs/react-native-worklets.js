/**
 * react-native-worklets web stub
 *
 * Stub completo basado en los exports reales de react-native-worklets@0.5.1:
 *   deprecated.js, featureFlags, isSynchronizable, runtimeKind, runtimes,
 *   serializable, serializableMappingCache, synchronizable, threads, workletFunction, WorkletsModule
 *
 * En web todos operan en el mismo hilo JS — los stubs son seguros y silenciosos.
 */

'use strict';

const identity = (v) => v;
const noop = () => {};

// ---------- deprecated.js ----------
const isShareableRef = () => false;
const makeShareable = identity;
const makeShareableCloneOnUIRecursive = identity;
const makeShareableCloneRecursive = identity;
const shareableMappingCache = { get: () => undefined, set: noop, delete: noop };

// ---------- featureFlags ----------
const getStaticFeatureFlag = () => false;
const setDynamicFeatureFlag = noop;

// ---------- isSynchronizable ----------
const isSynchronizable = () => false;

// ---------- runtimeKind ----------
const RuntimeKind = { JS: 'JS', UI: 'UI', Background: 'Background' };
const getRuntimeKind = () => RuntimeKind.JS;

// ---------- runtimes ----------
const createWorkletRuntime = () => ({});
const runOnRuntime = (_runtime, fn) => fn;

// ---------- serializable ----------
const createSerializable = identity;
const isSerializableRef = () => false;

// ---------- serializableMappingCache ----------
const serializableMappingCache = { get: () => undefined, set: noop, delete: noop };

// ---------- synchronizable ----------
const createSynchronizable = identity;

// ---------- threads ----------
const callMicrotasks = noop;
const executeOnUIRuntimeSync = (fn) => { try { return fn(); } catch(e) {} };
const runOnJS = (fn) => fn;
const runOnUI = (fn) => fn;
const runOnUIAsync = (fn) => () => Promise.resolve();
const runOnUISync = (fn) => fn;
const scheduleOnRN = (fn) => fn;
const scheduleOnUI = (fn) => fn;
const unstable_eventLoopTask = noop;

// ---------- workletFunction ----------
const isWorkletFunction = () => false;

// ---------- WorkletsModule ----------
const WorkletsModule = {
  createSerializable: identity,
  makeShareable: identity,
  runOnUI: (fn) => fn,
  runOnJS: (fn) => fn,
  scheduleOnUI: (fn) => fn,
};

module.exports = {
  // deprecated
  isShareableRef,
  makeShareable,
  makeShareableCloneOnUIRecursive,
  makeShareableCloneRecursive,
  shareableMappingCache,
  // featureFlags
  getStaticFeatureFlag,
  setDynamicFeatureFlag,
  // isSynchronizable
  isSynchronizable,
  // runtimeKind
  getRuntimeKind,
  RuntimeKind,
  // runtimes
  createWorkletRuntime,
  runOnRuntime,
  // serializable
  createSerializable,
  isSerializableRef,
  // serializableMappingCache
  serializableMappingCache,
  // synchronizable
  createSynchronizable,
  // threads
  callMicrotasks,
  executeOnUIRuntimeSync,
  runOnJS,
  runOnUI,
  runOnUIAsync,
  runOnUISync,
  scheduleOnRN,
  scheduleOnUI,
  unstable_eventLoopTask,
  // workletFunction
  isWorkletFunction,
  // WorkletsModule
  WorkletsModule,
};
