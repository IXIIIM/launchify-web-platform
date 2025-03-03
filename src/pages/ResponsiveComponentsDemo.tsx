import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  Avatar, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Divider,
  Paper,
  IconButton,
  ListItemButton
} from '@mui/material';
import {
  ResponsiveForm,
  ResponsiveCard,
  ResponsiveTable,
  ResponsiveImage,
  ResponsiveTabs,
  ResponsiveLayout
} from '../components/responsive';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useDeviceDetect } from '../hooks/useDeviceDetect';

// Define the Column type to match ResponsiveTable
interface Column<T> {
  id: keyof T;
  label: string;
  priority: 'high' | 'medium' | 'low';
}

const ResponsiveComponentsDemo: React.FC = () => {
  const { isMobile } = useDeviceDetect();
  const [activeTab, setActiveTab] = useState(0);
  const [formValues, setFormValues] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Mock data for table
  type TableData = {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
    lastActive: string;
  };
  
  const columns: Column<TableData>[] = [
    { id: 'name', label: 'Name', priority: 'high' },
    { id: 'email', label: 'Email', priority: 'medium' },
    { id: 'role', label: 'Role', priority: 'low' },
    { id: 'status', label: 'Status', priority: 'medium' },
    { id: 'lastActive', label: 'Last Active', priority: 'low' },
  ];
  
  const data: TableData[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active', lastActive: '2 hours ago' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Inactive', lastActive: '3 days ago' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Editor', status: 'Active', lastActive: '1 hour ago' },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'User', status: 'Active', lastActive: '5 minutes ago' },
    { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', role: 'Viewer', status: 'Pending', lastActive: '1 day ago' },
  ];
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Simulate API call
    setTimeout(() => {
      if (Math.random() > 0.7) {
        setError('Something went wrong. Please try again.');
      } else {
        console.log('Form submitted:', formValues);
        setFormValues({ name: '', email: '', message: '' });
      }
      setLoading(false);
    }, 1500);
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };
  
  // Tabs content
  const tabs = [
    {
      label: 'Form',
      icon: <HomeIcon />,
      content: (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Responsive Form Demo</Typography>
          <ResponsiveForm
            title="Contact Us"
            description="Fill out this form to get in touch with our team."
            onSubmit={handleSubmit}
            isLoading={loading}
            isError={error !== ''}
            errorMessage={error}
            submitLabel="Send Message"
            cancelLabel="Reset"
            onCancel={() => setFormValues({ name: '', email: '', message: '' })}
          >
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formValues.name}
              onChange={handleInputChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formValues.email}
              onChange={handleInputChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Message"
              name="message"
              multiline
              rows={4}
              value={formValues.message}
              onChange={handleInputChange}
              margin="normal"
              required
            />
          </ResponsiveForm>
        </Box>
      )
    },
    {
      label: 'Cards',
      icon: <DashboardIcon />,
      content: (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Responsive Card Demo</Typography>
          <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2 }}>
            <ResponsiveCard
              title="Basic Card"
              subheader="Simple card example"
              content={
                <Typography variant="body2">
                  This is a basic card with title, subheader, and content.
                </Typography>
              }
              actions={
                <>
                  <Button size="small">Learn More</Button>
                  <Button size="small" color="primary">Action</Button>
                </>
              }
            />
            
            <ResponsiveCard
              title="Card with Image"
              subheader="Card with image example"
              image="https://source.unsplash.com/random/800x600/?nature"
              content={
                <Typography variant="body2">
                  This card includes an image along with title, subheader, and content.
                </Typography>
              }
              expandableContent={
                <Box sx={{ p: 1 }}>
                  <Typography paragraph>
                    This is expandable content that is hidden by default and can be toggled.
                    It's useful for showing additional details without taking up space initially.
                  </Typography>
                </Box>
              }
              actions={
                <>
                  <Button size="small">Share</Button>
                  <Button size="small" color="primary">Explore</Button>
                </>
              }
            />
          </Box>
        </Box>
      )
    },
    {
      label: 'Table',
      icon: <SettingsIcon />,
      content: (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Responsive Table Demo</Typography>
          <ResponsiveTable<TableData>
            columns={columns}
            data={data}
            keyExtractor={(item) => item.id}
            expandableContent={(row) => (
              <Box sx={{ p: 2 }}>
                <Typography variant="subtitle2">Additional Information</Typography>
                <Typography variant="body2">
                  {row.name} is a {row.role.toLowerCase()} user who was last active {row.lastActive}.
                  Their current status is {row.status.toLowerCase()}.
                </Typography>
              </Box>
            )}
            onRowClick={(row) => console.log('Row clicked:', row)}
            pagination
            rowsPerPageOptions={[5, 10, 25]}
            defaultRowsPerPage={5}
          />
        </Box>
      )
    },
    {
      label: 'Image',
      icon: <AccountCircleIcon />,
      content: (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Responsive Image Demo</Typography>
          <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 3 }}>
            <ResponsiveImage
              src="https://source.unsplash.com/random/800x600/?mountain"
              alt="Mountain landscape"
              mobileWidth="100%"
              tabletWidth={300}
              desktopWidth={400}
              mobileHeight={200}
              tabletHeight={225}
              desktopHeight={300}
              objectFit="cover"
              borderRadius={8}
              caption="Beautiful mountain landscape"
              onClick={() => alert('Image clicked!')}
            />
            
            <ResponsiveImage
              src="https://source.unsplash.com/random/800x600/?ocean"
              alt="Ocean view"
              mobileWidth="100%"
              tabletWidth={300}
              desktopWidth={400}
              aspectRatio="16/9"
              objectFit="cover"
              borderRadius={8}
              caption="Stunning ocean view"
              onClick={() => alert('Image clicked!')}
            />
          </Box>
        </Box>
      )
    },
    {
      label: 'Tabs',
      icon: <ExpandMoreIcon />,
      content: (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Responsive Tabs Demo (Nested)</Typography>
          <Paper elevation={1} sx={{ p: 2 }}>
            <ResponsiveTabs
              tabs={[
                {
                  label: 'Horizontal',
                  content: (
                    <Box sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>Horizontal Tabs</Typography>
                      <Typography variant="body2">
                        These are standard horizontal tabs that adapt to screen size.
                        On smaller screens, they will show fewer tabs with an overflow menu.
                      </Typography>
                    </Box>
                  )
                },
                {
                  label: 'Vertical',
                  content: (
                    <Box sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>Vertical Tabs</Typography>
                      <Typography variant="body2">
                        Vertical tabs are useful for more complex navigation structures.
                        They can be configured to show on the left or right side.
                      </Typography>
                    </Box>
                  )
                },
                {
                  label: 'Scrollable',
                  content: (
                    <Box sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>Scrollable Tabs</Typography>
                      <Typography variant="body2">
                        Scrollable tabs allow for many tab options without taking up too much space.
                        Users can scroll through the available tabs.
                      </Typography>
                    </Box>
                  )
                },
                {
                  label: 'Full Width',
                  content: (
                    <Box sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>Full Width Tabs</Typography>
                      <Typography variant="body2">
                        Full width tabs distribute the available space equally among all tabs.
                        This works well for a small number of tabs with similar label lengths.
                      </Typography>
                    </Box>
                  )
                },
                {
                  label: 'Centered',
                  content: (
                    <Box sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>Centered Tabs</Typography>
                      <Typography variant="body2">
                        Centered tabs are aligned in the center of the container.
                        This creates a balanced look for the navigation.
                      </Typography>
                    </Box>
                  )
                }
              ]}
              maxVisibleTabs={3}
            />
          </Paper>
        </Box>
      )
    }
  ];
  
  // Sidebar content
  const sidebarContent = (
    <List>
      <ListItem>
        <Typography variant="h6">Components</Typography>
      </ListItem>
      <Divider />
      {tabs.map((tab, index) => (
        <ListItemButton
          key={index} 
          selected={activeTab === index}
          onClick={() => setActiveTab(index)}
        >
          <ListItemIcon>{tab.icon}</ListItemIcon>
          <ListItemText primary={tab.label} />
        </ListItemButton>
      ))}
    </List>
  );
  
  // Header content
  const headerContent = (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <IconButton color="inherit">
        <SettingsIcon />
      </IconButton>
      <IconButton color="inherit">
        <AccountCircleIcon />
      </IconButton>
    </Box>
  );
  
  // Footer content
  const footerContent = (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Typography variant="body2" color="text.secondary">
        © {new Date().getFullYear()} Launchify - Responsive Components Demo
      </Typography>
    </Box>
  );
  
  return (
    <ResponsiveLayout
      title="Responsive Components"
      sidebar={sidebarContent}
      header={headerContent}
      footer={footerContent}
      fullHeight
    >
      {tabs[activeTab].content}
    </ResponsiveLayout>
  );
};

export default ResponsiveComponentsDemo; 