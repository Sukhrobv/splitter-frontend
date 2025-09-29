from pathlib import Path
path = Path(r'app/tabs/profile.tsx')
text = path.read_text(encoding='utf-8')
press_block = "\r\n          <YStack gap=\"$3\">\r\n            <Pressable onPress={handleGoHome} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>\r\n              <XStack ai=\"center\" gap=\"$1\">\r\n                <ChevronLeft size={16} color=\"$gray11\" />\r\n                <Text fontSize={14} color=\"$gray10\">Main menu</Text>\r\n              </XStack>\r\n            </Pressable>\r\n\r\n            <YStack"
replacement = "\r\n          <YStack gap=\"$3\">\r\n            <YStack"
if press_block not in text:
    raise SystemExit('press block not found')
text = text.replace(press_block, replacement, 1)
text = text.replace("  const handleGoHome = useCallback(() => {\r\n    router.replace({ pathname: '/tabs' });\r\n  }, [router]);\r\n\r\n", "")
text = text.replace("import { Alert, Pressable } from 'react-native';", "import { Alert } from 'react-native';")
text = text.replace("import { Copy, Settings, LogOut, ChevronRight, ChevronLeft } from '@tamagui/lucide-icons';", "import { Copy, Settings, LogOut, ChevronRight } from '@tamagui/lucide-icons';")
path.write_text(text, encoding='utf-8')
