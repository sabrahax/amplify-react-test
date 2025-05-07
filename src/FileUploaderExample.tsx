import '@aws-amplify/ui-react/styles.css';
import { uploadData } from '@aws-amplify/storage';
import { fetchAuthSession, getCurrentUser } from '@aws-amplify/auth';
import { useRef, useState, forwardRef, useEffect } from 'react';

// Define custom interfaces for TypeScript
interface CustomFile extends File {
  webkitRelativePath: string;
}

// Extend HTMLInputElement attributes for TypeScript
declare module 'react' {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    webkitdirectory?: string | boolean;
    directory?: string | boolean;
    mozdirectory?: string | boolean;
  }
}

// Custom input component to handle folder selection
const FolderInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>((props, ref) => {
  return <input ref={ref} {...props} />;
});

export const DefaultFileUploaderExample = () => {
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [lastUploadCount, setLastUploadCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [uploadMode, setUploadMode] = useState<'files' | 'folder'>('files');

  // Handle drag-over to indicate the drop zone is active
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isUploading) setIsDragging(true);
  };

  // Handle drag-leave to reset the drop zone style
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  // Get the current user's username when component mounts
  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const { username: cognitoUsername } = await getCurrentUser();
        if (cognitoUsername) {
          setUsername(cognitoUsername);
          console.log('Current username:', cognitoUsername);
        }
      } catch (error) {
        console.log('Could not get username:', error);
      }
    };
    
    fetchUsername();
  }, []);

  // Process and upload files from a folder
  const processAndUploadFiles = async (files: FileList | CustomFile[]) => {
    if (files.length === 0) {
      console.log('No files selected');
      setErrorMessage('No files selected');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadedFiles([]);
    setErrorMessage('');

    const fileArray: CustomFile[] = Array.from(files) as CustomFile[];
    console.log(`Processing ${fileArray.length} files`);

    try {
      const session = await fetchAuthSession();
      const identityId = session.identityId;

      if (!identityId) {
        throw new Error('Identity ID not found');
      }

      const uploadedPaths: string[] = [];
      let completedUploads = 0;

      // Determine if we're dealing with a folder upload by checking if any file has a path
      const isFolder = fileArray.some(file => file.webkitRelativePath && file.webkitRelativePath.includes('/'));
      
      // For folder uploads, preserve the folder structure
      // For file uploads, place them directly in the user's directory
      const uploadPromises = fileArray.map(async (file) => {
        let relativePath;
        
        if (isFolder) {
          // For folder uploads, use the full relative path
          relativePath = file.webkitRelativePath || file.name;
        } else {
          // For individual files, just use the filename
          relativePath = file.name;
        }
        
        // Use the simplest possible path structure with just the username
        // Format: {username}/{path}
        const s3Key = username ? `${username}/${relativePath}` : `${identityId}/${relativePath}`;
        
        uploadedPaths.push(relativePath);

        try {
          const result = await uploadData({
            key: s3Key,
            data: file,
            options: {
              contentType: file.type || 'application/octet-stream',
              accessLevel: 'protected', // Using protected access level
            },
          }).result;

          completedUploads++;
          setUploadProgress(Math.round((completedUploads / fileArray.length) * 100));

          return result;
        } catch (error) {
          console.error(`Error uploading file ${relativePath}:`, error);
          throw error;
        }
      });

      await Promise.all(uploadPromises);
      // Update the uploaded files list with the new files
      setUploadedFiles(uploadedPaths);
      // Store the count of files in this upload
      setLastUploadCount(uploadedPaths.length);
      console.log('Files uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading folder:', error);
      setErrorMessage(`Upload failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file or folder selection via input
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      console.log('Selected files:', files.length);
      
      // Log the first file to check path information
      if (files[0]) {
        const firstFile = files[0] as CustomFile;
        console.log('First file:', firstFile.name);
        if (firstFile.webkitRelativePath) {
          console.log('Path:', firstFile.webkitRelativePath);
        }
      }
      
      processAndUploadFiles(files);
    } else {
      console.log('No files selected');
      setErrorMessage('No files selected');
    }
  };

  // Handle folder drop and upload
  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    
    // Check if items are available (for folder support)
    if (event.dataTransfer.items) {
      const items = event.dataTransfer.items;
      const files: CustomFile[] = [];
      let hasFolder = false;

      console.log('Dropped items:', items.length);
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // Check if webkitGetAsEntry is available
        if (item.webkitGetAsEntry) {
          const entry = item.webkitGetAsEntry();
          
          if (entry) {
            console.log('Entry type:', entry.isDirectory ? 'directory' : 'file');
            
            if (entry.isDirectory) {
              hasFolder = true;
              
              // Process directory
              const directoryReader = (entry as FileSystemDirectoryEntry).createReader();
              
              const readEntries = async () => {
                return new Promise<FileSystemEntry[]>((resolve) => {
                  directoryReader.readEntries((entries) => resolve(entries));
                });
              };
              
              const processEntry = async (entry: FileSystemEntry, path: string = '') => {
                if (entry.isFile) {
                  const fileEntry = entry as FileSystemFileEntry;
                  const file = await new Promise<File>((resolve) => {
                    fileEntry.file(resolve);
                  });
                  
                  // Create a custom file object with webkitRelativePath
                  const customFile = Object.assign(file, {
                    webkitRelativePath: `${path}${entry.name}`,
                  }) as CustomFile;
                  
                  files.push(customFile);
                } else if (entry.isDirectory) {
                  const dirEntry = entry as FileSystemDirectoryEntry;
                  const reader = dirEntry.createReader();
                  
                  const subEntries = await new Promise<FileSystemEntry[]>((resolve) => {
                    reader.readEntries((entries) => resolve(entries));
                  });
                  
                  for (const subEntry of subEntries) {
                    await processEntry(subEntry, `${path}${entry.name}/`);
                  }
                }
              };
              
              const entries = await readEntries();
              for (const entry of entries) {
                await processEntry(entry);
              }
            } else if (entry.isFile) {
              // Process file
              const fileEntry = entry as FileSystemFileEntry;
              const file = await new Promise<File>((resolve) => {
                fileEntry.file(resolve);
              });
              
              // For single files, use the filename as the path
              files.push(Object.assign(file, { 
                webkitRelativePath: file.name 
              }) as CustomFile);
            }
          }
        } else if (item.kind === 'file') {
          // Fallback for browsers that don't support webkitGetAsEntry
          const file = item.getAsFile();
          if (file) {
            files.push(Object.assign(file, { 
              webkitRelativePath: file.name 
            }) as CustomFile);
          }
        }
      }
      
      if (files.length === 0) {
        if (hasFolder) {
          console.log('Folder structure detected but no files found');
          setErrorMessage('Folder structure detected but no files found. This might be a browser limitation.');
        } else {
          console.log('No files found in dropped items');
          setErrorMessage('No files found in dropped items');
        }
        return;
      }
      
      console.log('Processing dropped files:', files.length);
      processAndUploadFiles(files);
    } else {
      // Fallback to using dataTransfer.files (won't preserve folder structure)
      const fileList = event.dataTransfer.files;
      if (fileList.length > 0) {
        console.log('Processing dropped files (flat structure):', fileList.length);
        processAndUploadFiles(fileList);
      } else {
        setErrorMessage('No files found in drop');
      }
    }
  };

  // Check browser support for folder selection
  const checkFolderSupport = () => {
    const input = document.createElement('input');
    const isDirectorySupported = 'webkitdirectory' in input || 
                                'directory' in input ||
                                'mozdirectory' in input;
    return isDirectorySupported;
  };
  
  // Trigger folder input click
  const openFolderDialog = () => {
    if (folderInputRef.current) {
      // Check if the browser supports directory selection
      if (!checkFolderSupport()) {
        setErrorMessage('Your browser may not support folder selection. Try using Chrome, Firefox, or Edge.');
        console.warn('Directory selection may not be supported in this browser');
        return;
      }
      
      folderInputRef.current.click();
    }
  };

  return (
    <div>
      <h2>File & Folder Upload</h2>

      <div style={{ marginBottom: '2rem' }}>
        {/* Toggle buttons for upload mode */}
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setUploadMode('files')}
            style={{
              padding: '8px 15px',
              backgroundColor: uploadMode === 'files' ? '#007bff' : '#e9ecef',
              color: uploadMode === 'files' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Files
          </button>
          <button
            onClick={() => setUploadMode('folder')}
            style={{
              padding: '8px 15px',
              backgroundColor: uploadMode === 'folder' ? '#007bff' : '#e9ecef',
              color: uploadMode === 'folder' ? 'white' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Folder
          </button>
        </div>

        {uploadMode === 'folder' && (
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
            Note: Folder upload works best in Chrome, Firefox, and Edge browsers.
          </p>
        )}

        {/* Hidden inputs for file/folder selection */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          multiple
        />
        
        <FolderInput
          type="file"
          ref={folderInputRef}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          webkitdirectory="true"
          directory="true"
          mozdirectory="true"
          multiple
        />

        {/* Button to trigger file/folder selection */}
        <button
          onClick={() => {
            if (uploadMode === 'folder') {
              openFolderDialog();
            } else {
              if (fileInputRef.current) fileInputRef.current.click();
            }
          }}
          style={{
            padding: '10px 15px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            marginBottom: '1rem',
            opacity: isUploading ? 0.7 : 1,
          }}
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : uploadMode === 'folder' ? 'Select Folder' : 'Select Files'}
        </button>

        {/* Unified drag-and-drop zone */}
        <div
          ref={dropZoneRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: isDragging ? '2px dashed #007bff' : '2px dashed #ccc',
            padding: '20px',
            textAlign: 'center',
            backgroundColor: isDragging ? '#e6f3ff' : '#f8f9fa',
            borderRadius: '4px',
            cursor: isUploading ? 'not-allowed' : 'default',
            opacity: isUploading ? 0.7 : 1,
          }}
        >
          <p>
            {isUploading 
              ? 'Uploading...' 
              : `Drag and drop ${uploadMode === 'folder' ? 'a folder' : 'files'} here to upload`}
          </p>
          {isUploading && (
            <div style={{ width: '100%', marginTop: '10px' }}>
              <div style={{ 
                height: '10px', 
                backgroundColor: '#e9ecef', 
                borderRadius: '5px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${uploadProgress}%`, 
                  height: '100%', 
                  backgroundColor: '#007bff',
                  transition: 'width 0.3s ease-in-out'
                }}></div>
              </div>
              <p>{uploadProgress}% complete</p>
            </div>
          )}
        </div>
      </div>

      {/* Display error message */}
      {errorMessage && (
        <div style={{ color: 'red', marginTop: '1rem' }}>{errorMessage}</div>
      )}

      {/* Display uploaded files */}
      {uploadedFiles.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Upload Complete</h3>
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#d4edda', 
            color: '#155724',
            border: '1px solid #c3e6cb',
            borderRadius: '4px',
            marginBottom: '1rem'
          }}>
            {lastUploadCount > 0 && (
              <p style={{ margin: 0 }}>
                Successfully uploaded {lastUploadCount} {lastUploadCount === 1 ? 'file' : 'files'}
              </p>
            )}
            <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem' }}>
              Total files: {uploadedFiles.length}
            </p>
          </div>
          <details>
            <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>View uploaded files</summary>
            <ul
              style={{
                maxHeight: '200px',
                overflowY: 'auto',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            >
              {uploadedFiles.map((file, index) => (
                <li key={index}>{file}</li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </div>
  );
};