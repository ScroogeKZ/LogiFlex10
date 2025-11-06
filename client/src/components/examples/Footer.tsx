import Footer from '../Footer';
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

export default function FooterExample() {
  return (
    <QueryClientProvider client={queryClient}>
      <Footer />
    </QueryClientProvider>
  );
}