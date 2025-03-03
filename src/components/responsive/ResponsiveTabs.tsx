import React, { useState } from 'react';
import {
  Tabs,
  Tab,
  Box,
  Typography,
  useTheme,
  IconButton,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useDeviceDetect } from '../../hooks/useDeviceDetect';

interface TabItem {
  label: string;
  icon?: React.ReactElement;
  content: React.ReactNode;
  disabled?: boolean;
}

interface ResponsiveTabsProps {
  tabs: TabItem[];
  defaultTab?: number;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'standard' | 'scrollable' | 'fullWidth';
  centered?: boolean;
  onChange?: (index: number) => void;
  tabsWidth?: number | string;
  contentWidth?: number | string;
  maxVisibleTabs?: number;
  showAllOnDesktop?: boolean;
}

/**
 * A responsive tabs component that adapts to different screen sizes
 * On mobile, it shows a limited number of tabs and provides a dropdown for the rest
 * On desktop, it shows all tabs or uses scrollable tabs based on configuration
 */
const ResponsiveTabs: React.FC<ResponsiveTabsProps> = ({
  tabs,
  defaultTab = 0,
  orientation = 'horizontal',
  variant = 'standard',
  centered = false,
  onChange,
  tabsWidth,
  contentWidth,
  maxVisibleTabs = 3,
  showAllOnDesktop = true
}) => {
  const theme = useTheme();
  const { isMobile, isTablet } = useDeviceDetect();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  
  // Determine if we need to show the overflow menu
  const showOverflowMenu = (isMobile || isTablet || !showAllOnDesktop) && tabs.length > maxVisibleTabs;
  
  // Visible tabs
  const visibleTabs = showOverflowMenu ? tabs.slice(0, maxVisibleTabs - 1) : tabs;
  
  // Overflow tabs
  const overflowTabs = showOverflowMenu ? tabs.slice(maxVisibleTabs - 1) : [];
  
  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    // If the last visible tab is clicked (overflow menu button)
    if (showOverflowMenu && newValue === maxVisibleTabs - 1) {
      return;
    }
    
    setActiveTab(newValue);
    if (onChange) onChange(newValue);
  };
  
  // Handle overflow menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  // Handle overflow menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  // Handle overflow tab selection
  const handleOverflowTabSelect = (index: number) => {
    const actualIndex = maxVisibleTabs - 1 + index;
    setActiveTab(actualIndex);
    if (onChange) onChange(actualIndex);
    handleMenuClose();
  };
  
  // Determine if the tab is active
  const isTabActive = (index: number) => {
    if (showOverflowMenu && index >= maxVisibleTabs - 1) {
      return activeTab === index;
    }
    return activeTab === index;
  };
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: orientation === 'vertical' ? 'row' : 'column',
        width: '100%'
      }}
    >
      {/* Tabs */}
      <Box
        sx={{
          width: orientation === 'vertical' ? tabsWidth || 200 : '100%',
          borderRight: orientation === 'vertical' ? 1 : 0,
          borderBottom: orientation === 'horizontal' ? 1 : 0,
          borderColor: 'divider'
        }}
      >
        <Tabs
          value={activeTab < visibleTabs.length ? activeTab : maxVisibleTabs - 1}
          onChange={handleTabChange}
          orientation={orientation}
          variant={variant}
          centered={centered}
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            '.MuiTabs-indicator': {
              display: showOverflowMenu && activeTab >= visibleTabs.length ? 'none' : undefined
            }
          }}
        >
          {visibleTabs.map((tab, index) => (
            <Tab
              key={`tab-${index}`}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
              disabled={tab.disabled}
            />
          ))}
          
          {/* Overflow menu button */}
          {showOverflowMenu && (
            <Tab
              icon={<MoreVertIcon />}
              aria-label="more tabs"
              aria-haspopup="true"
              onClick={handleMenuOpen}
              sx={{
                minWidth: 'auto',
                '&.Mui-selected': {
                  color: 'text.primary'
                }
              }}
            />
          )}
        </Tabs>
        
        {/* Overflow menu */}
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
          MenuListProps={{
            'aria-labelledby': 'overflow-tabs-button',
          }}
        >
          {overflowTabs.map((tab, index) => (
            <MenuItem
              key={`overflow-tab-${index}`}
              onClick={() => handleOverflowTabSelect(index)}
              selected={isTabActive(maxVisibleTabs - 1 + index)}
              disabled={tab.disabled}
            >
              {tab.icon && (
                <Box component="span" sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                  {tab.icon}
                </Box>
              )}
              <Typography variant="body2">{tab.label}</Typography>
            </MenuItem>
          ))}
        </Menu>
      </Box>
      
      {/* Tab content */}
      <Box
        sx={{
          p: 2,
          width: orientation === 'vertical' ? contentWidth || 'calc(100% - 200px)' : '100%',
          height: orientation === 'vertical' ? '100%' : 'auto'
        }}
      >
        {tabs[activeTab]?.content}
      </Box>
    </Box>
  );
};

export default ResponsiveTabs; 