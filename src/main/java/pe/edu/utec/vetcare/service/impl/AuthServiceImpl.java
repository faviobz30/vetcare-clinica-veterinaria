package pe.edu.utec.vetcare.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import pe.edu.utec.vetcare.dto.request.LoginRequest;
import pe.edu.utec.vetcare.dto.request.RegisterRequest;
import pe.edu.utec.vetcare.dto.response.AuthResponse;
import pe.edu.utec.vetcare.dto.response.UsuarioResponse;
import pe.edu.utec.vetcare.entity.PropietarioEntity;
import pe.edu.utec.vetcare.entity.RolEntity;
import pe.edu.utec.vetcare.entity.UsuarioEntity;
import pe.edu.utec.vetcare.exception.BadRequestException;
import pe.edu.utec.vetcare.exception.ResourceNotFoundException;
import pe.edu.utec.vetcare.mapper.UsuarioMapper;
import pe.edu.utec.vetcare.repository.PropietarioRepository;
import pe.edu.utec.vetcare.repository.RolRepository;
import pe.edu.utec.vetcare.repository.UsuarioRepository;
import pe.edu.utec.vetcare.security.CustomUserDetailsService;
import pe.edu.utec.vetcare.security.JwtService;
import pe.edu.utec.vetcare.service.AuthService;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService customUserDetailsService;
    private final JwtService jwtService;

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PropietarioRepository propietarioRepository;
    private final UsuarioMapper usuarioMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public AuthResponse login(LoginRequest request) {

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getCorreo(),
                        request.getContrasena()
                )
        );

        UserDetails userDetails =
                customUserDetailsService.loadUserByUsername(
                        request.getCorreo()
                );

        String token = jwtService.generateToken(userDetails);

        return new AuthResponse(token);
    }

    @Override
    @Transactional
    public UsuarioResponse register(RegisterRequest request) {

        if (usuarioRepository.existsByCorreo(request.getCorreo())) {
            throw new BadRequestException(
                    "El correo ya se encuentra registrado"
            );
        }

        if (usuarioRepository.existsByNroDocumento(
                request.getNroDocumento()
        )) {
            throw new BadRequestException(
                    "El documento ya se encuentra registrado"
            );
        }

        RolEntity rolPropietario = rolRepository
                .findByNombre("ROLE_PROPIETARIO")
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Rol ROLE_PROPIETARIO no encontrado"
                        )
                );

        UsuarioEntity usuario = new UsuarioEntity();

        usuario.setNombres(request.getNombres());
        usuario.setApellidos(request.getApellidos());
        usuario.setTipoDocumento(request.getTipoDocumento());
        usuario.setNroDocumento(request.getNroDocumento());
        usuario.setCorreo(request.getCorreo());
        usuario.setNroCelular(request.getNroCelular());

        usuario.setContrasena(
                passwordEncoder.encode(
                        request.getContrasena()
                )
        );

        usuario.setRol(rolPropietario);

        UsuarioEntity usuarioGuardado =
                usuarioRepository.save(usuario);

        PropietarioEntity propietario =
                new PropietarioEntity();

        propietario.setUsuario(usuarioGuardado);
        propietario.setDireccion(request.getDireccion());

        propietarioRepository.save(propietario);

        return usuarioMapper.toResponse(usuarioGuardado);
    }
}