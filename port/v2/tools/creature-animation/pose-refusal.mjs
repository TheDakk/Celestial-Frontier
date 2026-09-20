/** Only failures of a valid posed geometry are recoverable presentation frames.
 * Admission, malformed producers and call-order errors never use this type. */
export class RecoverablePoseError extends Error {
 constructor(code,message){super(message);if(!['ARAP_FOLD','PAINT_FOLD'].includes(code))throw Error('Unknown pose refusal code');this.name='RecoverablePoseError';this.code=code;}
}
