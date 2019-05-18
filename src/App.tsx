import { API, graphqlOperation } from "aws-amplify";
import { withAuthenticator } from "aws-amplify-react";
import { createNote, deleteNote, updateNote } from "graphql/mutations";
import { listNotes } from "graphql/queries";
import { onCreateNote, onDeleteNote, onUpdateNote } from "graphql/subscriptions";
import React from "react";
import * as Observable from "zen-observable";

type NotesType = {
  id: string;
  Note: string;
};
const App: React.FC = () => {
  const initalValue: NotesType[] = [];

  let initialvalue: any = null;
  const [loading, setLoading] = React.useState(Date.now());
  const [notes, setNotes] = React.useState(initalValue);
  const [note, setNote] = React.useState("");
  const [id, setId] = React.useState("");
  function handleChangeNote(e: any) {
    setNote(e.target.value);
  }

  const getNotes = async () => {
    const res: any = await API.graphql(graphqlOperation(listNotes));
    setNotes(res.data.listNotes.items);
    console.log("hier");
  };
  React.useEffect(() => {
    // const [rSub, dSub, uSub]: any =
    getNotes();
    const createNoteListener = (API.graphql(graphqlOperation(onCreateNote)) as Observable<any>).subscribe({
      next: noteData => {
        const newNote = noteData.value.data.onCreateNote;
        setNotes(prevNotes => {
          const oldNotes = prevNotes.filter(note => note.id !== newNote.id);
          const newNotes = [...oldNotes, newNote];
          return newNotes;
        });
      }
    });

    const deleteNoteListener = (API.graphql(graphqlOperation(onDeleteNote)) as Observable<any>).subscribe({
      next: noteData => {
        const newNote = noteData.value.data.onDeleteNote;
        console.log(newNote);
        setNotes(prevNotes => {
          const newNotes = prevNotes.filter((note: any) => note.id !== newNote.id);
          return newNotes;
        });
      }
    });
    const updateNoteListener = (API.graphql(graphqlOperation(onUpdateNote)) as Observable<any>).subscribe({
      next: noteData => {
        const updatedNote = noteData.value.data.onUpdateNote;
        setNotes(prevNotes => {
          const index = prevNotes.findIndex(note => note.id === updatedNote.id);
          if (index > 0) {
            const updatedNotes = [...prevNotes.slice(0, index), updatedNote, ...prevNotes.slice(index + 1)];
            return updatedNotes;
          } else return prevNotes;
        });
      }
    });
    return () => {
      createNoteListener.unsubscribe();
      deleteNoteListener.unsubscribe();
      updateNoteListener.unsubscribe();
    };
  }, []);

  async function handleDelete(id: string) {
    const input = { id };
    const result: any = await API.graphql(graphqlOperation(deleteNote, { input }));
  }

  async function handleSetNote(note: any) {
    setNote(note.Note);
    setId(note.id);
  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    if (id) {
      handleUpdateNote();
    } else {
      await handleAddNote();
    }
  }

  async function handleAddNote() {
    const input = { Note: note };
    await API.graphql(graphqlOperation(createNote, { input }));

    setNote("");
  }
  async function handleUpdateNote() {
    const input = { Note: note, id };
    await API.graphql(graphqlOperation(updateNote, { input }));
    // // setNotes([newNote, ...notes]);
    setNote("");
    setId("");
  }

  if (!notes) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-column items-center justify-center pa3 bg-washed-red">
      <h1 className="code f2-l">Amplify Notetaker - {loading}</h1>
      <form className="mb3" onSubmit={handleSubmit}>
        <input type="text" className="pa2 f4" placeholder="write your note" value={note} onChange={handleChangeNote} />
        <button className="pa2 f4" type="submit">
          {id ? "Update Note" : "Take Note"}
        </button>
      </form>
      <div>
        {notes.map((note: any) => (
          <div className="flex items-center" key={note.id}>
            <li className="list pa1 f3" onClick={() => handleSetNote(note)}>
              {note.Note}
            </li>
            <button className="bg-transparent bn f4" onClick={() => handleDelete(note.id)}>
              <span>&times;</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default withAuthenticator(App, { includeGreetings: true });
