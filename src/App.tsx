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

  function createTodo() {
    client.models.Todo.create({ content: window.prompt("Todo content") });
  }

  function deleteTodo(id: string) {
    client.models.Todo.delete({ id });
  }

  const username = user?.signInDetails?.loginId?.split('@')[0] || "Guest";

  return (
    <main>
      <h4>{username}</h4>
      <button onClick={createTodo}>⇪ Welcome, please select your files to upload!</button>
      
      <ul>
        {todos.map((todo) => (
          <li key={todo.id} onClick={() => deleteTodo(todo.id)}>
            {todo.content}
          </li>
        ))}
      </ul>
      <div>
        <button onClick={signOut}>Logout</button>
        <br />
        <a href="">
          Please remember to sign out!
        </a>
      </div>
      <div>
        <h4></h4>
        <DefaultFileUploaderExample /> {/* Use the new component */}
      </div>
    </main>
  );
}

export default App;