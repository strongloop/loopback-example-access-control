{
  'targets': [
    {
      'target_name': 'timekit',
      'sources': [
        'src/profiler.cc',
        'src/profiler.h'
      ],
      'conditions': [
        ['OS == "win"', {
            'sources': [
              'src/timekit_win.cc'
            ]
          }, {
            'sources': [
              'src/timekit_posix.cc'
            ]
          }
        ]
      ]
    }
  ]
}
