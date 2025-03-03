# Responsive Components for Launchify Web Platform

This directory contains a collection of responsive UI components designed to adapt to different screen sizes, providing an optimal user experience across desktop, tablet, and mobile devices.

## Components Overview

### ResponsiveForm

A form component that adapts to different screen sizes:
- On mobile, form fields stack vertically and buttons are full width
- On desktop, form maintains a maximum width and buttons are aligned to the right

```tsx
<ResponsiveForm
  title="Contact Us"
  description="Fill out this form to get in touch with our team."
  onSubmit={handleSubmit}
  isLoading={loading}
  isError={hasError}
  errorMessage={errorMessage}
  submitLabel="Send Message"
  cancelLabel="Reset"
  onCancel={handleReset}
>
  {/* Form fields go here */}
</ResponsiveForm>
```

### ResponsiveCard

A card component that adapts to different screen sizes:
- Adjusts image height and content layout based on screen size
- Supports expandable content, which is particularly useful on mobile
- Optimizes for vertical space on mobile and provides more detailed information on desktop

```tsx
<ResponsiveCard
  title="Card Title"
  subheader="Card Subheader"
  image="path/to/image.jpg"
  content={<Typography>Card content goes here</Typography>}
  expandableContent={<Typography>Additional details that can be expanded</Typography>}
  actions={<Button>Action Button</Button>}
/>
```

### ResponsiveTable

A table component that adapts to different screen sizes:
- Shows only high-priority columns on mobile
- Provides a full table view on desktop
- Supports expandable rows for additional details
- Includes pagination and loading states

```tsx
<ResponsiveTable<DataType>
  columns={columns}
  data={data}
  keyExtractor={(item) => item.id}
  expandableContent={(row) => <Typography>Additional details for {row.name}</Typography>}
  onRowClick={handleRowClick}
  pagination
  rowsPerPageOptions={[5, 10, 25]}
  defaultRowsPerPage={10}
/>
```

### ResponsiveImage

An image component that adapts to different screen sizes:
- Adjusts dimensions based on screen size
- Supports aspect ratio, object fit, and border radius
- Includes loading state and error handling
- Optional caption and click handling

```tsx
<ResponsiveImage
  src="path/to/image.jpg"
  alt="Image description"
  mobileWidth="100%"
  tabletWidth={300}
  desktopWidth={400}
  aspectRatio="16/9"
  objectFit="cover"
  borderRadius={8}
  caption="Image caption"
  onClick={handleImageClick}
/>
```

### ResponsiveTabs

A tabs component that adapts to different screen sizes:
- On mobile, shows a limited number of tabs with an overflow menu
- On desktop, shows all tabs or uses scrollable tabs
- Supports horizontal and vertical orientations
- Includes customizable tab content

```tsx
<ResponsiveTabs
  tabs={[
    {
      label: "Tab 1",
      icon: <Icon />,
      content: <div>Tab 1 content</div>
    },
    // More tabs...
  ]}
  orientation="horizontal"
  variant="standard"
  maxVisibleTabs={3}
/>
```

### ResponsiveLayout

A layout component that provides a responsive structure:
- Includes optional sidebar, header, and footer
- On mobile, the sidebar becomes a drawer that can be toggled
- Adjusts content width and padding based on screen size
- Supports full height layouts and paper-wrapped content

```tsx
<ResponsiveLayout
  title="Page Title"
  sidebar={<SidebarContent />}
  header={<HeaderContent />}
  footer={<FooterContent />}
  fullHeight
  paperContent
>
  <MainContent />
</ResponsiveLayout>
```

## Usage

Import components individually:

```tsx
import { ResponsiveForm } from '../components/responsive';
```

Or import multiple components:

```tsx
import {
  ResponsiveForm,
  ResponsiveCard,
  ResponsiveTable,
  ResponsiveImage,
  ResponsiveTabs,
  ResponsiveLayout
} from '../components/responsive';
```

## Demo

A comprehensive demo of all responsive components is available at:

```tsx
import ResponsiveComponentsDemo from '../pages/ResponsiveComponentsDemo';
```

This demo showcases all components with various configurations and provides a reference for implementation. 