/** Instrument counterpart of the product compact rule, shared by the measured
 * dock, Charts and completion sentinel. Height matters on phone landscape. */
export function usesPhoneDock({width,height}){
 return Number.isFinite(width)&&Number.isFinite(height)&&width>0&&height>0
  &&(width<=700||(width<=900&&width>height));
}
