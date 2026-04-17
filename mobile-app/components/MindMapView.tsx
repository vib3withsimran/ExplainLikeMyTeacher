import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Fonts, Spacing, Radii, useTheme } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FlowNode {
  id: string;
  data: { label: string };
  position: { x: number; y: number };
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  animated: boolean;
}

interface MindMapViewProps {
  mindmapData: any;
}

// ─── Tree → Nodes + Edges ─────────────────────────────────────────────────────

function generateFlow(data: any): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  let idCounter = 0;

  function traverse(
    node: any,
    parentId: string | null,
    level: number,
    posX: number
  ) {
    const currentId = `${idCounter++}`;
    // Support multiple possible field names from the Gradio API
    const label =
      node.topic || node.name || node.label || node.title || String(node);

    nodes.push({
      id: currentId,
      data: { label },
      position: { x: posX, y: level * 130 },
    });

    if (parentId !== null) {
      edges.push({
        id: `e-${parentId}-${currentId}`,
        source: parentId,
        target: currentId,
        animated: true,
      });
    }

    // Support multiple possible children field names
    const children =
      node.children || node.subtopics || node.nodes || node.branches || [];
    if (Array.isArray(children) && children.length > 0) {
      const spacing = 220;
      const totalWidth = (children.length - 1) * spacing;
      const startX = posX - totalWidth / 2;
      children.forEach((child: any, i: number) => {
        traverse(child, currentId, level + 1, startX + i * spacing);
      });
    }
  }

  traverse(data, null, 0, 0);
  return { nodes, edges };
}

// ─── HTML Builder ─────────────────────────────────────────────────────────────

function buildHtml(nodes: FlowNode[], edges: FlowEdge[]): string {
  const nodesJson = JSON.stringify(nodes);
  const edgesJson = JSON.stringify(edges);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes">
  <link rel="stylesheet" href="https://unpkg.com/reactflow@11/dist/style.css">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #0a0a1a; }
    #root { width: 100%; height: 100%; }

    .react-flow__node-default {
      background: linear-gradient(135deg, #1e1b4b, #312e81);
      border: 1.5px solid #7c3aed;
      color: #e2e8f0;
      border-radius: 10px;
      font-size: 13px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: 10px 16px;
      box-shadow: 0 4px 20px rgba(124, 58, 237, 0.25);
      max-width: 180px;
      text-align: center;
      white-space: normal;
      word-break: break-word;
      cursor: pointer;
      transition: box-shadow 0.2s, border-color 0.2s;
    }
    .react-flow__node-default.selected,
    .react-flow__node-default:hover {
      border-color: #a78bfa;
      box-shadow: 0 0 24px rgba(167, 139, 250, 0.55);
    }

    .react-flow__edge-path { stroke: #7c3aed !important; stroke-width: 2; }
    .react-flow__edge-path.animated { stroke-dasharray: 6; animation: dash 1.5s linear infinite; }
    @keyframes dash { to { stroke-dashoffset: -12; } }

    .react-flow__controls {
      background: #1a1040;
      border: 1px solid #4c1d95;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
    }
    .react-flow__controls-button {
      background: #1a1040;
      border-bottom: 1px solid #312e81;
      fill: #a78bfa;
    }
    .react-flow__controls-button:hover { background: #2e2563; }

    .react-flow__minimap {
      background: #0d0d1a;
      border: 1px solid #4c1d95;
      border-radius: 8px;
      overflow: hidden;
    }
    .react-flow__minimap-mask { fill: rgba(124, 58, 237, 0.18); }
    .react-flow__minimap-node { fill: #7c3aed; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/reactflow@11/dist/umd/index.js"></script>
  <script>
    (function() {
      try {
        var h = React.createElement;
        var RF = window.ReactFlow;

        // v11 UMD: window.ReactFlow is the namespace object
        var FlowComponent = RF.ReactFlow;
        var Controls     = RF.Controls;
        var MiniMap      = RF.MiniMap;
        var Background   = RF.Background;
        var useNodesState = RF.useNodesState;
        var useEdgesState = RF.useEdgesState;
        var useCallback   = React.useCallback;

        var initialNodes = ${nodesJson};
        var initialEdges = ${edgesJson};

        function MindMap() {
          var ns = useNodesState(initialNodes);
          var es = useEdgesState(initialEdges);
          var nodes = ns[0], onNodesChange = ns[2];
          var edges = es[0], onEdgesChange = es[2];

          var onNodeClick = useCallback(function(event, node) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'nodeClick',
                label: node.data.label
              }));
            }
          }, []);

          return h(
            FlowComponent,
            {
              nodes: nodes,
              edges: edges,
              onNodesChange: onNodesChange,
              onEdgesChange: onEdgesChange,
              onNodeClick: onNodeClick,
              fitView: true,
              fitViewOptions: { padding: 0.25 },
              style: { background: '#0a0a1a' }
            },
            h(Controls, { key: 'controls' }),
            h(MiniMap, {
              key: 'minimap',
              nodeColor: '#7c3aed',
              maskColor: 'rgba(124,58,237,0.18)'
            }),
            h(Background, {
              key: 'bg',
              color: '#2d2463',
              gap: 24,
              size: 1.5
            })
          );
        }

        var root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(h(MindMap, null));
      } catch(err) {
        document.body.innerHTML =
          '<div style="color:#f87171;padding:24px;font-family:monospace;background:#1a0a0a;height:100%">'
          + '<b>ReactFlow Error:</b><br>' + err.message + '</div>';
      }
    })();
  </script>
</body>
</html>`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MindMapView({ mindmapData }: MindMapViewProps) {
  const theme = useTheme();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const { nodes, edges } = useMemo(
    () => generateFlow(mindmapData),
    [mindmapData]
  );

  const html = useMemo(() => buildHtml(nodes, edges), [nodes, edges]);

  const handleMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'nodeClick') {
        setSelectedNode(data.label);
      }
    } catch (e) {
      // ignore non-JSON messages
    }
  }, []);

  const dismissNode = useCallback(() => setSelectedNode(null), []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      position: 'relative',
    },
    webview: {
      flex: 1,
      backgroundColor: '#0a0a1a',
    },
    nodeCard: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.surface,
      borderTopWidth: 1.5,
      borderTopColor: theme.primary,
      borderTopLeftRadius: Radii.xl,
      borderTopRightRadius: Radii.xl,
      padding: Spacing.xl,
      paddingBottom: Spacing.xxl,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 10,
    },
    nodeCardLabel: {
      ...Fonts.labelSm,
      color: theme.primary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: Spacing.sm,
    },
    nodeCardTopic: {
      ...Fonts.headlineSm,
      color: theme.on_surface,
    },
    closeButton: {
      position: 'absolute',
      top: Spacing.md,
      right: Spacing.lg,
      width: 32,
      height: 32,
      borderRadius: Radii.full,
      backgroundColor: theme.surface_container_high,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeText: {
      ...Fonts.headlineSm,
      color: theme.on_surface_variant,
      lineHeight: 20,
    },
  });

  return (
    <View style={styles.container}>
      <WebView
        source={{ html }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={handleMessage}
        startInLoadingState={true}
        renderLoading={() => (
          <View
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#0a0a1a',
            }}
          >
            <Text style={{ color: '#a78bfa', fontSize: 14 }}>
              Loading map renderer...
            </Text>
          </View>
        )}
      />

      {selectedNode && (
        <View style={styles.nodeCard}>
          <Text style={styles.nodeCardLabel}>Topic</Text>
          <Text style={styles.nodeCardTopic}>{selectedNode}</Text>
          <Pressable style={styles.closeButton} onPress={dismissNode}>
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
