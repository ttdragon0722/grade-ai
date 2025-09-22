import Header from "../_components/header";
import { ExamProvider } from "../_context/ExamContext";

const ExamDetailLayout = ({ children }: { children: React.ReactNode }) => {
    return <>
        <ExamProvider>
            <Header />
            {children}
        </ExamProvider>
    </>
}

export default ExamDetailLayout;