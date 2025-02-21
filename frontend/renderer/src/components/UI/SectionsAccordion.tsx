import { FC, ReactNode } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export interface SectionItem {
  label: string;
  content: ReactNode;
}

interface SectionsAccordionProps {
  sections: SectionItem[];
}

export const SectionsAccordion: FC<SectionsAccordionProps> = ({ sections }) => {
  return (
    <>
      {sections.map((section, index) => (
        <Accordion key={index}
        sx={{ 
          backgroundColor: '#424242', 
          color: 'white'
        }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}
          sx={{ 
            backgroundColor: '#616161', 
            color: 'white'
          }}>
            <Typography variant="subtitle1">{section.label}</Typography>
          </AccordionSummary>
          <AccordionDetails
          sx={{
            backgroundColor: '#424242',
            color: 'white'
          }}>
            {section.content}
          </AccordionDetails>
        </Accordion>
      ))}
    </>
  );
};