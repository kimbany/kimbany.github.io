import 'package:audio_service/audio_service.dart';
import 'package:audio_session/audio_session.dart';
import 'package:flutter/material.dart';
import 'package:flutter_soloud/flutter_soloud.dart';

late final AsmrAudioHandler audioHandler;

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await SoLoud.instance.init();

  final session = await AudioSession.instance;
  await session.configure(const AudioSessionConfiguration.music());

  audioHandler = await AudioService.init(
    builder: () => AsmrAudioHandler(),
    config: const AudioServiceConfig(
      androidNotificationChannelId: 'com.example.asmr_poc.channel.audio',
      androidNotificationChannelName: 'ASMR Playback',
      androidNotificationOngoing: true,
      androidStopForegroundOnPause: false,
    ),
  );

  runApp(const PoCApp());
}

// ---------------- Track Model ----------------

class Track {
  Track({required this.id, required this.label, required this.assetPath});

  final String id;
  final String label;
  final String assetPath;

  AudioSource? source;
  SoundHandle? handle;
  double volume = 0.5;
  bool enabled = false;
}

// ---------------- Audio Handler ----------------

class AsmrAudioHandler extends BaseAudioHandler {
  final List<Track> tracks = [
    Track(id: 'rain',   label: '빗소리',   assetPath: 'assets/sounds/rain.mp3'),
    Track(id: 'fire',   label: '모닥불',   assetPath: 'assets/sounds/fire.mp3'),
    Track(id: 'wind',   label: '바람',     assetPath: 'assets/sounds/wind.mp3'),
    Track(id: 'stream', label: '시냇물',   assetPath: 'assets/sounds/stream.mp3'),
  ];

  bool _loaded = false;
  bool _playing = false;

  AsmrAudioHandler() {
    mediaItem.add(const MediaItem(
      id: 'asmr_mix',
      title: '4-Track ASMR Mix',
      artist: 'PoC',
      album: 'Background Verification',
      playable: true,
    ));
    _emitState(playing: false);
  }

  Future<void> loadAll() async {
    if (_loaded) return;
    for (final t in tracks) {
      t.source = await SoLoud.instance.loadAsset(t.assetPath);
    }
    _loaded = true;
  }

  Future<void> toggleTrack(String id, bool on) async {
    final t = tracks.firstWhere((e) => e.id == id);
    t.enabled = on;
    if (!_playing) return;
    if (on) {
      await _startTrack(t);
    } else {
      await _stopTrack(t);
    }
  }

  Future<void> setVolume(String id, double v) async {
    final t = tracks.firstWhere((e) => e.id == id);
    t.volume = v;
    if (t.handle != null) {
      SoLoud.instance.setVolume(t.handle!, v);
    }
  }

  Future<void> _startTrack(Track t) async {
    if (t.source == null || t.handle != null) return;
    final h = await SoLoud.instance.play(t.source!, volume: 0.0, looping: true);
    t.handle = h;
    SoLoud.instance.fadeVolume(h, t.volume, const Duration(seconds: 1));
  }

  Future<void> _stopTrack(Track t) async {
    final h = t.handle;
    if (h == null) return;
    SoLoud.instance.fadeVolume(h, 0.0, const Duration(seconds: 1));
    await Future.delayed(const Duration(milliseconds: 1100));
    SoLoud.instance.stop(h);
    t.handle = null;
  }

  @override
  Future<void> play() async {
    await loadAll();
    _playing = true;
    for (final t in tracks) {
      if (t.enabled) await _startTrack(t);
    }
    _emitState(playing: true);
  }

  @override
  Future<void> pause() async {
    _playing = false;
    for (final t in tracks) {
      await _stopTrack(t);
    }
    _emitState(playing: false);
  }

  @override
  Future<void> stop() async {
    await pause();
    return super.stop();
  }

  void _emitState({required bool playing}) {
    playbackState.add(PlaybackState(
      controls: [
        if (playing) MediaControl.pause else MediaControl.play,
        MediaControl.stop,
      ],
      systemActions: const {MediaAction.play, MediaAction.pause, MediaAction.stop},
      androidCompactActionIndices: const [0, 1],
      playing: playing,
      processingState: AudioProcessingState.ready,
    ));
  }
}

// ---------------- UI ----------------

class PoCApp extends StatelessWidget {
  const PoCApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ASMR PoC',
      theme: ThemeData.dark(useMaterial3: true),
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Multitrack + Background PoC')),
      body: StreamBuilder<PlaybackState>(
        stream: audioHandler.playbackState,
        builder: (context, snapshot) {
          final playing = snapshot.data?.playing ?? false;
          return Column(
            children: [
              const Padding(
                padding: EdgeInsets.all(16),
                child: Text(
                  '4개 트랙을 켜고 [재생]을 누르면 동시에 들립니다.\n'
                  '화면을 꺼도 / 백그라운드로 보내도 계속 재생되어야 합니다.\n'
                  '잠금화면에서 재생/정지가 가능한지 확인하세요.',
                  style: TextStyle(fontSize: 13),
                ),
              ),
              Expanded(
                child: ListView.separated(
                  itemCount: audioHandler.tracks.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (context, i) => _TrackTile(track: audioHandler.tracks[i]),
                ),
              ),
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        playing ? audioHandler.pause() : audioHandler.play();
                      },
                      icon: Icon(playing ? Icons.stop : Icons.play_arrow),
                      label: Text(playing ? '정지' : '재생'),
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _TrackTile extends StatefulWidget {
  const _TrackTile({required this.track});
  final Track track;

  @override
  State<_TrackTile> createState() => _TrackTileState();
}

class _TrackTileState extends State<_TrackTile> {
  @override
  Widget build(BuildContext context) {
    final t = widget.track;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Switch(
                value: t.enabled,
                onChanged: (v) async {
                  await audioHandler.toggleTrack(t.id, v);
                  setState(() {});
                },
              ),
              const SizedBox(width: 12),
              Text(t.label, style: const TextStyle(fontSize: 16)),
              const Spacer(),
              Text('${(t.volume * 100).round()}%'),
            ],
          ),
          Slider(
            value: t.volume,
            onChanged: (v) async {
              await audioHandler.setVolume(t.id, v);
              setState(() {});
            },
          ),
        ],
      ),
    );
  }
}
