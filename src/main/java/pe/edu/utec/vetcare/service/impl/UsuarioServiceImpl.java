package pe.edu.utec.vetcare.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.utec.vetcare.dto.request.ChangePasswordRequest;
import pe.edu.utec.vetcare.dto.request.CreateUsuarioRequest;
import pe.edu.utec.vetcare.dto.request.UpdateMyProfileRequest;
import pe.edu.utec.vetcare.dto.request.UpdateUsuarioRequest;
import pe.edu.utec.vetcare.dto.response.UsuarioResponse;
import pe.edu.utec.vetcare.entity.RolEntity;
import pe.edu.utec.vetcare.entity.UsuarioEntity;
import pe.edu.utec.vetcare.exception.BadRequestException;
import pe.edu.utec.vetcare.exception.ResourceNotFoundException;
import pe.edu.utec.vetcare.mapper.UsuarioMapper;
import pe.edu.utec.vetcare.repository.RolRepository;
import pe.edu.utec.vetcare.repository.UsuarioRepository;
import pe.edu.utec.vetcare.service.UsuarioService;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UsuarioServiceImpl implements UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final UsuarioMapper usuarioMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public List<UsuarioResponse> listar() {

        return usuarioRepository.findAll()
                .stream()
                .map(usuarioMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UsuarioResponse obtener(Long id) {

        return usuarioMapper.toResponse(
                buscarUsuario(id)
        );
    }

    @Override
    @Transactional
    public UsuarioResponse crear(
            CreateUsuarioRequest request
    ) {

        // Validar correo duplicado
        if (usuarioRepository.existsByCorreo(
                request.getCorreo()
        )) {
            throw new BadRequestException(
                    "El correo ya se encuentra registrado"
            );
        }

        // Validar documento duplicado
        if (usuarioRepository.existsByNroDocumento(
                request.getNroDocumento()
        )) {
            throw new BadRequestException(
                    "El documento ya se encuentra registrado"
            );
        }

        // Buscar rol
        RolEntity rol = rolRepository
                .findById(request.getIdRol())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Rol no encontrado"
                        )
                );

        // Convertir DTO a Entity
        UsuarioEntity entity =
                usuarioMapper.toEntity(request);

        // Encriptar contraseña
        entity.setContrasena(
                passwordEncoder.encode(
                        entity.getContrasena()
                )
        );

        // Asignar rol
        entity.setRol(rol);

        // Guardar y devolver
        return usuarioMapper.toResponse(
                usuarioRepository.save(entity)
        );
    }

    @Override
    @Transactional
    public UsuarioResponse actualizar(
            Long id,
            UpdateUsuarioRequest request
    ) {

        UsuarioEntity entity =
                buscarUsuario(id);

        RolEntity rol = rolRepository
                .findById(request.getIdRol())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Rol no encontrado"
                        )
                );

        usuarioMapper.updateEntity(
                request,
                entity
        );

        entity.setRol(rol);

        return usuarioMapper.toResponse(
                usuarioRepository.save(entity)
        );
    }

    @Override
    @Transactional
    public UsuarioResponse actualizarMiPerfil(
            UpdateMyProfileRequest request
    ) {
        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        String correoActual =
                authentication.getName();

        UsuarioEntity usuario =
                usuarioRepository
                        .findByCorreo(correoActual)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Usuario autenticado no encontrado"
                                )
                        );

        if (!usuario.getCorreo()
                .equalsIgnoreCase(request.getCorreo())
                && usuarioRepository.existsByCorreo(
                request.getCorreo()
        )) {

            throw new BadRequestException(
                    "El correo ya se encuentra registrado"
            );
        }

        usuario.setNombres(request.getNombres());
        usuario.setApellidos(request.getApellidos());
        usuario.setCorreo(request.getCorreo());
        usuario.setNroCelular(request.getNroCelular());

        UsuarioEntity usuarioActualizado = usuarioRepository.save(usuario);

        return usuarioMapper.toResponse(usuarioActualizado);
    }

    @Override
    @Transactional
    public void cambiarContrasena(
            Long id,
            ChangePasswordRequest request
    ) {

        UsuarioEntity entity =
                buscarUsuario(id);

        if (!passwordEncoder.matches(
                request.getContrasenaActual(),
                entity.getContrasena()
        )) {

            throw new BadRequestException(
                    "La contraseña actual es incorrecta"
            );
        }

        entity.setContrasena(
                passwordEncoder.encode(
                        request.getNuevaContrasena()
                )
        );

        usuarioRepository.save(entity);
    }

    @Override
    @Transactional
    public void eliminar(Long id) {

        UsuarioEntity entity =
                buscarUsuario(id);

        usuarioRepository.delete(entity);
    }

    private UsuarioEntity buscarUsuario(Long id) {

        return usuarioRepository
                .findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Usuario no encontrado"
                        )
                );
    }
}