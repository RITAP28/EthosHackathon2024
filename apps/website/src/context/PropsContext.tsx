import { createContext, useState } from "react"
export const PropsContext = createContext(null);

function PropsContextProvider({ children } : { children: React.ReactNode }) {
    const [latestText, setLatestText] = useState('');
    const value = {
        latestText,
        setLatestText
    };
    return (
        <PropsContext.Provider value={value}>
            {children}
        </PropsContext.Provider>
    )
}

export default PropsContextProvider;