import {cloneArrayBuffer} from './cloneArrayBuffer';

export function cloneDataView(value: DataView): DataView {
  const buffer = cloneArrayBuffer(value.buffer as ArrayBuffer);
  const Ctor = value.constructor as typeof DataView;
  
  return new Ctor(
    buffer,
    value.byteOffset,
    value.byteLength
  );
}