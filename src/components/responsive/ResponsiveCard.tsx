import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  CardMedia,
  CardHeader,
  Typography,
  Box,
  IconButton,
  Button,
  Collapse,
  CardProps as MuiCardProps
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useDeviceDetect } from '../../hooks/useDeviceDetect';

interface ResponsiveCardProps extends Omit<MuiCardProps, 'title' | 'content'> {
  title?: React.ReactNode;
  subheader?: React.ReactNode;
  image?: string;
  imageHeight?: number | string;
  imageAlt?: string;
  content?: React.ReactNode;
  expandableContent?: React.ReactNode;
  actions?: React.ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  avatar?: React.ReactNode;
  action?: React.ReactNode;
  headerSx?: React.CSSProperties;
  contentSx?: React.CSSProperties;
  actionsSx?: React.CSSProperties;
}

/**
 * A responsive card component that adapts to different screen sizes
 * On mobile, it optimizes for vertical space and touch interactions
 * On desktop, it provides more detailed information and hover states
 */
const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  title,
  subheader,
  image,
  imageHeight,
  imageAlt = '',
  content,
  expandableContent,
  actions,
  primaryAction,
  secondaryAction,
  avatar,
  action,
  headerSx = {},
  contentSx = {},
  actionsSx = {},
  ...rest
}) => {
  const { isMobile } = useDeviceDetect();
  const [expanded, setExpanded] = React.useState(false);
  
  const handleExpandClick = () => {
    setExpanded(!expanded);
  };
  
  // Determine image height based on screen size
  const responsiveImageHeight = React.useMemo(() => {
    if (imageHeight) return imageHeight;
    return isMobile ? 140 : 200;
  }, [isMobile, imageHeight]);
  
  return (
    <Card {...rest}>
      {/* Card Header */}
      {(title || subheader || avatar || action) && (
        <CardHeader
          avatar={avatar}
          action={action}
          title={title}
          subheader={subheader}
          sx={{
            p: isMobile ? 1.5 : 2,
            ...headerSx
          }}
        />
      )}
      
      {/* Card Image */}
      {image && (
        <CardMedia
          component="img"
          height={responsiveImageHeight}
          image={image}
          alt={imageAlt}
        />
      )}
      
      {/* Card Content */}
      {content && (
        <CardContent sx={{ p: isMobile ? 1.5 : 2, ...contentSx }}>
          {typeof content === 'string' ? (
            <Typography variant="body2" color="text.secondary">
              {content}
            </Typography>
          ) : (
            content
          )}
        </CardContent>
      )}
      
      {/* Expandable Content */}
      {expandableContent && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <IconButton
              onClick={handleExpandClick}
              aria-expanded={expanded}
              aria-label="show more"
              sx={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s'
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
          </Box>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
              {expandableContent}
            </CardContent>
          </Collapse>
        </>
      )}
      
      {/* Card Actions */}
      {(actions || primaryAction || secondaryAction) && (
        <CardActions 
          sx={{ 
            p: isMobile ? 1.5 : 2,
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: isMobile ? 1 : 0,
            ...actionsSx
          }}
        >
          {actions ? (
            actions
          ) : (
            <>
              {secondaryAction && (
                <Button 
                  size={isMobile ? 'medium' : 'small'} 
                  onClick={secondaryAction.onClick}
                  disabled={secondaryAction.disabled}
                  fullWidth={isMobile}
                  variant="outlined"
                >
                  {secondaryAction.label}
                </Button>
              )}
              {primaryAction && (
                <Button 
                  size={isMobile ? 'medium' : 'small'} 
                  onClick={primaryAction.onClick}
                  disabled={primaryAction.disabled}
                  fullWidth={isMobile}
                  variant="contained"
                >
                  {primaryAction.label}
                </Button>
              )}
            </>
          )}
        </CardActions>
      )}
    </Card>
  );
};

export default ResponsiveCard; 