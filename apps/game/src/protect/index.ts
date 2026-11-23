export { askToKeepData, createPersistAsker, readPersistState, type StorageManagerLike } from './persist';
export {
  PROTECT_NAMESPACE, PROTECT_VERSION, backupFileName, checkRestoreText, createBackupText, readLastBackupAt,
  recordBackup, restoreBackup, type RestoreCheck,
} from './backup';
