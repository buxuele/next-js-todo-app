import { TodoProvider } from "@/contexts/TodoContext";
import MainLayout from "@/components/Layout/MainLayout";
import TodoContainer from "@/components/TodoContainer/TodoContainer";

export default function Home() {
  return (
    <TodoProvider>
      <MainLayout>
        <TodoContainer />
      </MainLayout>
    </TodoProvider>
  );
}
