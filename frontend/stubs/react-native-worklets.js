/**
 * react-native-worklets web stub
 *
 * react-native-worklets es una librería solo para iOS/Android.
 * En la web, exportamos stubs vacíos para evitar el error:
 * "WorkletsError: createSerializableObject should never be called in JSWorklets"
 */
module.exports = {
  createWorkletRuntime: () => ({}),
  runOnRuntime: (runtime, fn) => fn,
  runOnUI: (fn) => fn,
  runOnJS: (fn) => fn,
  isWorkletFunction: () => false,
  makeShareableCloneRecursive: (v) => v,
  makeShareable: (v) => v,
  getViewProp: () => Promise.resolve(),
  SharedValue: {},
  useSharedValue: (v) => ({ value: v }),
  useWorkletCallback: (fn) => fn,
  createWorklet: (fn) => fn,
};
