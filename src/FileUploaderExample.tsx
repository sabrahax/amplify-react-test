import { FileUploader } from '@aws-amplify/ui-react-storage';
import '@aws-amplify/ui-react/styles.css';

export const DefaultFileUploaderExample = () => {
  return (
    <FileUploader
      acceptedFileTypes={['*']} // Accept any type of files
      path={(entity) => `files/*/`}
      maxFileCount={10}
      isResumable
    />
  );
};