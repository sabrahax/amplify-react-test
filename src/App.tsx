import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { useAuthenticator } from '@aws-amplify/ui-react';
import { DefaultFileUploaderExample } from './FileUploaderExample'; // Import the new component
import '@aws-amplify/ui-react/styles.css';

const client = generateClient<Schema>();

function App() {
  const { user, signOut } = useAuthenticator();
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [] = useState<File | null>(null);

  useEffect(() => {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
  }, []);

  function deleteTodo(id: string) {
    client.models.Todo.delete({ id });
  }

  const username = user?.signInDetails?.loginId?.split('@')[0] || "Guest";

  return (
    <main>
      {/* AWS Logo */}
      <img 
        src="https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg" 
        alt="AWS Logo" 
        style={{ width: '100px', marginBottom: '1rem' }} 
      />
      <h4>Welcome, {username}</h4>
      {/* Banner */}
      <div
        style={{
          padding: "0.5rem",
          borderRadius: "20px",
          textAlign: "center",
          fontWeight: "bold",
          fontSize: "1.2rem" // Increased font size
        }}
      >
        Pathfinder Upload Tool (PUT)
      </div>
      
      <ul>
        {todos.map((todo) => (
          <li key={todo.id} onClick={() => deleteTodo(todo.id)}>
            {todo.content}
          </li>
        ))}
      </ul>
      
      <div>
        <DefaultFileUploaderExample /> {/* Use the new component */}
      </div>
      
      {/* Divider between file upload and logout */}
      <ul>
        {todos.map((todo) => (
          <li key={todo.id} onClick={() => deleteTodo(todo.id)}>
            {todo.content}
          </li>
        ))}
      </ul>
      
      <div>
        <button onClick={signOut} style={{ backgroundColor: 'green', color: 'white' }}>Logout</button>
        <br />
        <a href="">
          Please remember to sign out!
        </a>
      </div>
    </main>
  );
}

export default App;