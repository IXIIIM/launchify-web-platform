import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Calendar, ChevronDown, Filter, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { format, subDays, isAfter } from 'date-fns';

// Component code as shown in artifact above...
